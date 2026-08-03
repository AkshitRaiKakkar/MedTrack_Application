package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceScheduleAmendmentRequest;
import com.medtrack.dto.MaintenanceScheduleRevisionPageResponse;
import com.medtrack.dto.MaintenanceScheduleRevisionResponse;
import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceScheduleRevision;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.SlaState;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceScheduleRevisionRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/** Coordinates hospital-owned schedule changes and their immutable audit snapshots. */
@Service
@RequiredArgsConstructor
public class MaintenanceScheduleService {

    static final int DEFAULT_REVISION_PAGE_SIZE = 50;
    static final int MAX_REVISION_PAGE_SIZE = 100;
    private static final Set<String> PRIORITIES = Set.of("Normal", "High", "Critical");

    private final MaintenanceTaskRepository taskRepository;
    private final MaintenanceScheduleRevisionRepository revisionRepository;
    private final MaintenancePolicyRuleRepository policyRuleRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final MaintenanceActivityService activityService;

    @Transactional
    public MaintenanceTask amendSchedule(
            Long taskId,
            MaintenanceScheduleAmendmentRequest request,
            Authentication authentication) {
        if (request == null) {
            throw new IllegalArgumentException("Schedule amendment is required");
        }

        User actor = activeUser(authentication, "hospital");
        Hospital hospital = hospitalRepository.findByUserId(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        MaintenanceTask task = taskRepository.findByIdAndHospitalIdForUpdate(
                        taskId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Maintenance task not found or access denied"));

        validateAmendable(task);
        AmendmentValues values = validateAndResolveValues(task, request);
        List<String> changedFields = determineChangedFields(task, values);
        if (changedFields.isEmpty()) {
            throw new IllegalArgumentException(
                    "Schedule amendment must change at least one scheduling field");
        }

        int nextRevision = Objects.requireNonNullElse(task.getScheduleRevision(), 0) + 1;
        LocalDateTime amendedAt = LocalDateTime.now();
        MaintenanceScheduleRevision revision = snapshot(
                task, values, actor, nextRevision, request.getReason().trim(),
                changedFields, amendedAt);

        apply(task, values, nextRevision);
        refreshSlaEvidence(task, amendedAt);
        MaintenanceTask savedTask = taskRepository.save(task);
        revisionRepository.save(revision);
        activityService.recordScheduleAmendment(savedTask, actor, changedFields);
        return savedTask;
    }

    @Transactional(readOnly = true)
    public MaintenanceScheduleRevisionPageResponse getRevisions(
            Long taskId, Integer page, Integer size, Authentication authentication) {
        int resolvedPage = page != null ? page : 0;
        int resolvedSize = size != null ? size : DEFAULT_REVISION_PAGE_SIZE;
        validatePage(resolvedPage, resolvedSize);

        Long hospitalId = authorizeRevisionRead(taskId, authentication);
        Page<MaintenanceScheduleRevision> revisions = revisionRepository.findOwnedRevisions(
                taskId, hospitalId, PageRequest.of(resolvedPage, resolvedSize));
        return MaintenanceScheduleRevisionPageResponse.builder()
                .content(revisions.getContent().stream().map(this::toResponse).toList())
                .page(revisions.getNumber())
                .size(revisions.getSize())
                .totalElements(revisions.getTotalElements())
                .totalPages(revisions.getTotalPages())
                .first(revisions.isFirst())
                .last(revisions.isLast())
                .build();
    }

    private void validateAmendable(MaintenanceTask task) {
        if (task.getStatus() != MaintenanceStatus.SCHEDULED) {
            throw new InvalidStatusTransitionException(
                    "Schedule can only be amended while the task is Scheduled");
        }
        if (task.getHospitalId() == null
                || taskRepository.countValidOwnership(task.getId(), task.getHospitalId()) != 1) {
            throw new IllegalStateException(
                    "Maintenance task hospital ownership does not match its equipment");
        }
    }

    private AmendmentValues validateAndResolveValues(
            MaintenanceTask task, MaintenanceScheduleAmendmentRequest request) {
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new IllegalArgumentException("Amendment reason is required");
        }
        if (request.getDeadline() != null && request.getDeadline().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Amended deadline cannot be in the past");
        }

        String maintenanceType = request.getMaintenanceType() == null
                ? task.getMaintenanceType() : request.getMaintenanceType().trim();
        if (maintenanceType.isBlank()) {
            throw new IllegalArgumentException("Maintenance type cannot be blank");
        }

        String priority = request.getPriority() == null
                ? task.getPriority() : normalizePriority(request.getPriority());
        if (!PRIORITIES.contains(priority)) {
            throw new IllegalArgumentException("Priority must be Normal, High, or Critical");
        }
        if (request.getRecurrencePeriodDays() != null
                && request.getRecurrencePeriodDays() < 0) {
            throw new IllegalArgumentException("Recurrence period cannot be negative");
        }

        return new AmendmentValues(
                request.getDeadline() != null ? request.getDeadline() : task.getDeadline(),
                maintenanceType,
                request.getDescription() != null
                        ? normalizeNullable(request.getDescription()) : task.getDescription(),
                priority,
                request.getRecurrencePeriodDays() != null
                        ? request.getRecurrencePeriodDays() : task.getRecurrencePeriodDays());
    }

    private List<String> determineChangedFields(
            MaintenanceTask task, AmendmentValues values) {
        List<String> changed = new ArrayList<>();
        if (!Objects.equals(task.getDeadline(), values.deadline())) changed.add("deadline");
        if (!Objects.equals(task.getMaintenanceType(), values.maintenanceType())) {
            changed.add("maintenanceType");
        }
        if (!Objects.equals(task.getDescription(), values.description())) changed.add("description");
        if (!Objects.equals(task.getPriority(), values.priority())) changed.add("priority");
        if (!Objects.equals(task.getRecurrencePeriodDays(), values.recurrencePeriodDays())) {
            changed.add("recurrencePeriodDays");
        }
        return changed;
    }

    private MaintenanceScheduleRevision snapshot(
            MaintenanceTask task,
            AmendmentValues values,
            User actor,
            int revisionNumber,
            String reason,
            List<String> changedFields,
            LocalDateTime amendedAt) {
        return MaintenanceScheduleRevision.builder()
                .task(task)
                .hospitalId(task.getHospitalId())
                .revisionNumber(revisionNumber)
                .actorUserId(actor.getId())
                .actorEmail(normalizeEmail(actor.getEmail()))
                .reason(reason)
                .changedFields(String.join(",", changedFields))
                .previousDeadline(task.getDeadline())
                .newDeadline(values.deadline())
                .previousMaintenanceType(task.getMaintenanceType())
                .newMaintenanceType(values.maintenanceType())
                .previousDescription(task.getDescription())
                .newDescription(values.description())
                .previousPriority(task.getPriority())
                .newPriority(values.priority())
                .previousRecurrencePeriodDays(task.getRecurrencePeriodDays())
                .newRecurrencePeriodDays(values.recurrencePeriodDays())
                .amendedAt(amendedAt)
                .build();
    }

    private void apply(MaintenanceTask task, AmendmentValues values, int revisionNumber) {
        task.setDeadline(values.deadline());
        task.setMaintenanceType(values.maintenanceType());
        task.setDescription(values.description());
        task.setPriority(values.priority());
        task.setRecurrencePeriodDays(values.recurrencePeriodDays());
        task.setScheduleRevision(revisionNumber);
    }

    private void refreshSlaEvidence(MaintenanceTask task, LocalDateTime now) {
        int warningDays = 3;
        int breachDays = 1;
        if (task.getPolicyRuleId() != null) {
            MaintenancePolicyRule rule = policyRuleRepository.findByIdAndHospitalId(
                            task.getPolicyRuleId(), task.getHospitalId())
                    .orElseThrow(() -> new IllegalStateException(
                            "Generated maintenance task has no owned policy rule"));
            warningDays = Objects.requireNonNullElse(rule.getSlaWarningDays(), warningDays);
            breachDays = Objects.requireNonNullElse(rule.getSlaBreachDays(), breachDays);
        }

        LocalDateTime warningAt = task.getDeadline().minusDays(warningDays).atStartOfDay();
        LocalDateTime breachedAt = task.getDeadline().plusDays(breachDays).atTime(23, 59, 59);
        task.setSlaWarningAt(warningAt);
        task.setSlaBreachedAt(breachedAt);

        if (now.isAfter(breachedAt)) {
            task.setSlaState(task.getEscalatedTo() != null
                    ? SlaState.ESCALATED : SlaState.BREACHED);
        } else if (now.isAfter(warningAt)) {
            task.setSlaState(SlaState.WARNING);
            task.setEscalatedTo(null);
        } else {
            task.setSlaState(SlaState.UPCOMING);
            task.setEscalatedTo(null);
        }
    }

    private Long authorizeRevisionRead(Long taskId, Authentication authentication) {
        if (hasRole(authentication, "HOSPITAL")) {
            User hospitalUser = activeUser(authentication, "hospital");
            Hospital hospital = hospitalRepository.findByUserId(hospitalUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
            if (taskRepository.countOwnedTaskIncludingArchived(taskId, hospital.getId()) != 1) {
                throw new ResourceNotFoundException(
                        "Maintenance task not found or access denied");
            }
            return hospital.getId();
        }
        if (hasRole(authentication, "TECHNICIAN")) {
            User technician = activeUser(authentication, "technician");
            return taskRepository.findByIdAndAssignedTechnicianId(taskId, technician.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Maintenance task not found or not assigned to you"))
                    .getHospitalId();
        }
        throw new AccessDeniedException(
                "This role cannot access maintenance schedule revisions");
    }

    private User activeUser(Authentication authentication, String expectedRole) {
        if (authentication == null || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new AccessDeniedException(
                    "An active " + expectedRole + " account is required");
        }
        User user = userRepository.findByEmail(normalizeEmail(authentication.getName()))
                .orElseThrow(() -> new AccessDeniedException(
                        "An active " + expectedRole + " account is required"));
        if (!expectedRole.equalsIgnoreCase(user.getRole())
                || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "An active " + expectedRole + " account is required");
        }
        return user;
    }

    private MaintenanceScheduleRevisionResponse toResponse(MaintenanceScheduleRevision revision) {
        return MaintenanceScheduleRevisionResponse.builder()
                .id(revision.getId())
                .taskId(revision.getTaskId())
                .revisionNumber(revision.getRevisionNumber())
                .actorUserId(revision.getActorUserId())
                .actorEmail(revision.getActorEmail())
                .reason(revision.getReason())
                .changedFields(Arrays.stream(revision.getChangedFields().split(",")).toList())
                .previousDeadline(revision.getPreviousDeadline())
                .newDeadline(revision.getNewDeadline())
                .previousMaintenanceType(revision.getPreviousMaintenanceType())
                .newMaintenanceType(revision.getNewMaintenanceType())
                .previousDescription(revision.getPreviousDescription())
                .newDescription(revision.getNewDescription())
                .previousPriority(revision.getPreviousPriority())
                .newPriority(revision.getNewPriority())
                .previousRecurrencePeriodDays(revision.getPreviousRecurrencePeriodDays())
                .newRecurrencePeriodDays(revision.getNewRecurrencePeriodDays())
                .amendedAt(revision.getAmendedAt())
                .build();
    }

    private void validatePage(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Revision page index cannot be negative");
        }
        if (size <= 0 || size > MAX_REVISION_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Revision page size must be between 1 and " + MAX_REVISION_PAGE_SIZE);
        }
    }

    private String normalizePriority(String value) {
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return trimmed;
        return trimmed.substring(0, 1).toUpperCase(Locale.ROOT)
                + trimmed.substring(1).toLowerCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeEmail(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    private record AmendmentValues(
            LocalDate deadline,
            String maintenanceType,
            String description,
            String priority,
            Integer recurrencePeriodDays) {
    }
}
