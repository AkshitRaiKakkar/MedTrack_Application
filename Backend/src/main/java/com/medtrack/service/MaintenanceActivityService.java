package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceActivityPageResponse;
import com.medtrack.dto.MaintenanceActivityResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.*;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskActivityRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MaintenanceActivityService {
    public static final int DEFAULT_HISTORY_SIZE = 50;
    public static final int MAX_HISTORY_SIZE = 100;
    private static final String SYSTEM_EMAIL = "system@medtrack.internal";

    private final MaintenanceTaskActivityRepository activityRepository;
    private final MaintenanceTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public void recordCreated(MaintenanceTask task, User actor, String origin) {
        append(ActivityRecord.builder().task(task).eventType(MaintenanceActivityType.TASK_CREATED)
                .actor(actor).newStatus(task.getStatus()).newAssignee(task.getAssignedTechnician())
                .changedFields("taskCode,equipmentId,maintenanceType,deadline,priority,status,assignedTechnician")
                .summary("Maintenance task created " + origin).build());
    }

    public void recordSystemCreated(MaintenanceTask task, String origin) {
        append(ActivityRecord.builder().task(task).eventType(MaintenanceActivityType.TASK_CREATED)
                .newStatus(task.getStatus()).newAssignee(task.getAssignedTechnician())
                .changedFields("taskCode,equipmentId,maintenanceType,deadline,priority,status,assignedTechnician")
                .summary("Maintenance task created " + origin).build());
    }

    public void recordAssignment(MaintenanceTask task, User actor,
                                 String previousAssignee, String newAssignee) {
        append(ActivityRecord.builder().task(task)
                .eventType(previousAssignee == null ? MaintenanceActivityType.TECHNICIAN_ASSIGNED
                        : MaintenanceActivityType.TECHNICIAN_REASSIGNED)
                .actor(actor).previousStatus(task.getStatus()).newStatus(task.getStatus())
                .previousAssignee(previousAssignee).newAssignee(newAssignee)
                .changedFields("assignedTechnician")
                .summary(previousAssignee == null ? "Technician assigned to maintenance task"
                        : "Maintenance task reassigned to another technician").build());
    }

    public void recordTechnicianUpdate(MaintenanceTask task, User actor,
                                       MaintenanceStatus previousStatus, List<String> fields) {
        if (fields.isEmpty()) {
            return;
        }
        boolean statusChanged = previousStatus != task.getStatus();
        append(ActivityRecord.builder().task(task)
                .eventType(statusChanged ? MaintenanceActivityType.STATUS_CHANGED
                        : MaintenanceActivityType.WORK_DETAILS_UPDATED)
                .actor(actor).previousStatus(previousStatus).newStatus(task.getStatus())
                .previousAssignee(task.getAssignedTechnician()).newAssignee(task.getAssignedTechnician())
                .changedFields(String.join(",", fields))
                .summary(statusChanged ? "Maintenance task status changed"
                        : "Maintenance work details updated").build());
    }

    public void recordArchived(MaintenanceTask task, User actor) {
        append(ActivityRecord.builder().task(task).eventType(MaintenanceActivityType.TASK_ARCHIVED)
                .actor(actor).previousStatus(task.getStatus()).newStatus(task.getStatus())
                .previousAssignee(task.getAssignedTechnician()).newAssignee(task.getAssignedTechnician())
                .changedFields("deleted,deletedAt,deletedBy").summary("Maintenance task archived").build());
    }

    public void recordScheduleAmendment(
            MaintenanceTask task, User actor, List<String> changedFields) {
        append(ActivityRecord.builder().task(task)
                .eventType(MaintenanceActivityType.SCHEDULE_AMENDED)
                .actor(actor).previousStatus(task.getStatus()).newStatus(task.getStatus())
                .previousAssignee(task.getAssignedTechnician())
                .newAssignee(task.getAssignedTechnician())
                .changedFields(String.join(",", changedFields))
                .summary("Maintenance schedule amended to revision "
                        + task.getScheduleRevision()).build());
    }

    @Transactional(readOnly = true)
    public MaintenanceActivityPageResponse getHistory(Long taskId, String typeValue,
                                                       Integer page, Integer size,
                                                       Authentication authentication) {
        int resolvedPage = page != null ? page : 0;
        int resolvedSize = size != null ? size : DEFAULT_HISTORY_SIZE;
        if (resolvedPage < 0) throw new IllegalArgumentException("History page index cannot be negative");
        if (resolvedSize <= 0 || resolvedSize > MAX_HISTORY_SIZE) {
            throw new IllegalArgumentException("History page size must be between 1 and " + MAX_HISTORY_SIZE);
        }
        MaintenanceActivityType type = MaintenanceActivityType.fromFilter(typeValue);
        Long hospitalId = authorize(taskId, authentication);
        Page<MaintenanceTaskActivity> result = activityRepository.findOwnedHistory(
                taskId, hospitalId, type != null ? type.name() : null,
                PageRequest.of(resolvedPage, resolvedSize));
        return MaintenanceActivityPageResponse.builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getNumber()).size(result.getSize())
                .totalElements(result.getTotalElements()).totalPages(result.getTotalPages())
                .first(result.isFirst()).last(result.isLast()).build();
    }

    @Transactional
    protected void append(ActivityRecord record) {
        MaintenanceTask task = record.task;
        if (task == null || task.getId() == null || task.getHospitalId() == null) {
            throw new IllegalStateException("Activity requires a persisted, owned maintenance task");
        }
        User actor = record.actor;
        activityRepository.save(MaintenanceTaskActivity.builder().task(task)
                .hospitalId(task.getHospitalId())
                .sequenceNumber(activityRepository.findLastSequenceNumber(task.getId()) + 1)
                .eventType(record.eventType).actorUserId(actor != null ? actor.getId() : null)
                .actorEmail(actor != null ? normalizeEmail(actor.getEmail()) : SYSTEM_EMAIL)
                .actorRole(actor != null ? actor.getRole().toUpperCase(Locale.ROOT) : "SYSTEM")
                .previousStatus(record.previousStatus).newStatus(record.newStatus)
                .previousAssignee(normalizeNullable(record.previousAssignee))
                .newAssignee(normalizeNullable(record.newAssignee))
                .changedFields(record.changedFields).summary(record.summary)
                .occurredAt(LocalDateTime.now()).build());
    }

    private Long authorize(Long taskId, Authentication authentication) {
        if (hasRole(authentication, "HOSPITAL")) {
            User user = activeUser(authentication, "hospital");
            Hospital hospital = hospitalRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
            if (taskRepository.countOwnedTaskIncludingArchived(taskId, hospital.getId()) != 1) {
                throw new ResourceNotFoundException("Maintenance task not found or access denied");
            }
            return hospital.getId();
        }
        if (hasRole(authentication, "TECHNICIAN")) {
            User technician = activeUser(authentication, "technician");
            return taskRepository.findByIdAndAssignedTechnicianId(taskId, technician.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Maintenance task not found or not assigned to you")).getHospitalId();
        }
        throw new AccessDeniedException("This role cannot access maintenance task history");
    }

    private User activeUser(Authentication authentication, String role) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An active " + role + " account is required");
        }
        User user = userRepository.findByEmail(normalizeEmail(authentication.getName()))
                .orElseThrow(() -> new AccessDeniedException("An active " + role + " account is required"));
        if (!role.equalsIgnoreCase(user.getRole()) || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException("An active " + role + " account is required");
        }
        return user;
    }

    private MaintenanceActivityResponse toResponse(MaintenanceTaskActivity value) {
        return MaintenanceActivityResponse.builder().id(value.getId()).taskId(value.getTaskId())
                .sequenceNumber(value.getSequenceNumber()).eventType(value.getEventType())
                .actorUserId(value.getActorUserId()).actorEmail(value.getActorEmail())
                .actorRole(value.getActorRole()).previousStatus(value.getPreviousStatus())
                .newStatus(value.getNewStatus()).previousAssignee(value.getPreviousAssignee())
                .newAssignee(value.getNewAssignee())
                .changedFields(Arrays.stream(value.getChangedFields().split(",")).toList())
                .summary(value.getSummary()).occurredAt(value.getOccurredAt()).build();
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
    private String normalizeEmail(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalizeEmail(value);
    }

    @Builder
    private static class ActivityRecord {
        private MaintenanceTask task;
        private MaintenanceActivityType eventType;
        private User actor;
        private MaintenanceStatus previousStatus;
        private MaintenanceStatus newStatus;
        private String previousAssignee;
        private String newAssignee;
        private String changedFields;
        private String summary;
    }
}
