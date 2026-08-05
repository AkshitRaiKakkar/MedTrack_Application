package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceRuleRequest;
import com.medtrack.dto.MaintenanceRuleResponse;
import com.medtrack.dto.RulePreviewResponse;
import com.medtrack.dto.SlaSummaryResponse;
import com.medtrack.dto.TechnicianWorkloadResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceGenerationRun;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.OperationsEvent;
import com.medtrack.model.RecurrenceFrequency;
import com.medtrack.model.SlaState;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceGenerationRunRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Preventive-maintenance automation engine.
 *
 * <p>Owns recurrence rules, idempotent task generation, SLA state computation, escalation, and
 * workload-aware assignment suggestions. Generation is deliberately idempotent: re-running a rule
 * for the same window yields no duplicate tasks.</p>
 */
@Service
@RequiredArgsConstructor
public class PreventiveMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(PreventiveMaintenanceService.class);
    private static final List<String> SUGGESTION_PRIORITIES = List.of("Critical", "High");
    private static final int MAX_OCCURRENCES_PER_EQUIPMENT = 500;

    private final MaintenancePolicyRuleRepository ruleRepository;
    private final MaintenanceGenerationRunRepository runRepository;
    private final MaintenanceTaskRepository taskRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final MaintenanceActivityService activityService;
    private final EventPublisherService eventPublisherService;

    // ------------------------------------------------------------------
    // Rule CRUD
    // ------------------------------------------------------------------

    @Transactional
    public MaintenanceRuleResponse createRule(MaintenanceRuleRequest request, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        validateRule(request, hospitalId);

        MaintenancePolicyRule rule = MaintenancePolicyRule.builder()
                .hospitalId(hospitalId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .ruleScope(request.getRuleScope())
                .equipmentCategory(request.getEquipmentCategory())
                .equipmentRecordId(request.getEquipmentRecordId())
                .manufacturer(request.getManufacturer())
                .priority(request.getPriority())
                .frequency(request.getFrequency())
                .customIntervalDays(resolveIntervalDays(request))
                .maintenanceType(request.getMaintenanceType().trim())
                .slaWarningDays(request.getSlaWarningDays() != null ? request.getSlaWarningDays() : 3)
                .slaBreachDays(request.getSlaBreachDays() != null ? request.getSlaBreachDays() : 1)
                .leadTimeDays(request.getLeadTimeDays() != null ? request.getLeadTimeDays() : 7)
                .active(request.getActive() == null || request.getActive())
                .createdAt(LocalDateTime.now())
                .build();

        return MaintenanceRuleResponse.from(ruleRepository.save(rule), resolveEquipmentName(rule));
    }

    @Transactional
    public MaintenanceRuleResponse updateRule(Long id, MaintenanceRuleRequest request, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        MaintenancePolicyRule rule = ruleRepository.findByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found or access denied"));
        validateRule(request, hospitalId);

        rule.setName(request.getName().trim());
        rule.setDescription(request.getDescription());
        rule.setRuleScope(request.getRuleScope());
        rule.setEquipmentCategory(request.getEquipmentCategory());
        rule.setEquipmentRecordId(request.getEquipmentRecordId());
        rule.setManufacturer(request.getManufacturer());
        rule.setPriority(request.getPriority());
        rule.setFrequency(request.getFrequency());
        rule.setCustomIntervalDays(resolveIntervalDays(request));
        rule.setMaintenanceType(request.getMaintenanceType().trim());
        rule.setSlaWarningDays(request.getSlaWarningDays() != null ? request.getSlaWarningDays() : rule.getSlaWarningDays());
        rule.setSlaBreachDays(request.getSlaBreachDays() != null ? request.getSlaBreachDays() : rule.getSlaBreachDays());
        rule.setLeadTimeDays(request.getLeadTimeDays() != null ? request.getLeadTimeDays() : rule.getLeadTimeDays());
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }
        rule.setUpdatedAt(LocalDateTime.now());

        return MaintenanceRuleResponse.from(ruleRepository.save(rule), resolveEquipmentName(rule));
    }

    @Transactional
    public void deleteRule(Long id, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        MaintenancePolicyRule rule = ruleRepository.findByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found or access denied"));
        rule.setDeleted(true);
        rule.setDeletedAt(LocalDateTime.now());
        rule.setDeletedBy(authentication.getName().trim().toLowerCase(java.util.Locale.ROOT));
        ruleRepository.save(rule);
    }

    public List<MaintenanceRuleResponse> listRules(Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        return ruleRepository.findByHospitalId(hospitalId).stream()
                .map(rule -> MaintenanceRuleResponse.from(rule, resolveEquipmentName(rule)))
                .sorted(Comparator.comparing(MaintenanceRuleResponse::getId))
                .toList();
    }

    public MaintenanceRuleResponse getRule(Long id, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        MaintenancePolicyRule rule = ruleRepository.findByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found or access denied"));
        return MaintenanceRuleResponse.from(rule, resolveEquipmentName(rule));
    }

    // ------------------------------------------------------------------
    // Preview + generation
    // ------------------------------------------------------------------

    /**
     * Dry run: computes which equipment a rule matches and which due dates fall inside the
     * requested window, without persisting any task.
     */
    @Transactional(readOnly = true)
    public RulePreviewResponse previewRule(Long id, LocalDate windowStart, LocalDate windowEnd, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        MaintenancePolicyRule rule = ruleRepository.findByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found or access denied"));

        LocalDate start = windowStart != null ? windowStart : LocalDate.now();
        LocalDate end = windowEnd != null ? windowEnd : start.plusDays(rule.getLeadTimeDays());

        validateWindow(start, end);
        GenerationPlan plan = buildGenerationPlan(rule, hospitalId, start, end);

        return RulePreviewResponse.builder()
                .ruleId(rule.getId())
                .ruleName(rule.getName())
                .windowStart(start)
                .windowEnd(end)
                .totalDueDates(plan.dueDates().size())
                .matchedEquipment(plan.matchedEquipment().size())
                .wouldCreate(plan.occurrences().size())
                .skippedExisting(plan.skippedExisting())
                .dueDates(plan.dueDates())
                .matchedEquipmentCodes(plan.matchedEquipment().stream()
                        .map(Equipment::getEquipmentCode)
                        .toList())
                .build();
    }

    /**
     * Generates every missing rule/equipment/deadline occurrence inside the window. Re-running or
     * overlapping a window does not duplicate tasks because cadence is reconstructed from retained
     * generated task history.
     */
    @Transactional
    public MaintenanceGenerationRun generateTasks(Long id, LocalDate windowStart, LocalDate windowEnd, Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        return generateTasksForRule(id, hospitalId, windowStart, windowEnd);
    }

    /**
     * Scheduler entry point: generates for a rule of a hospital without an authenticated caller.
     * The same idempotent path as the API-facing method, so scheduled and manual runs cannot
     * diverge.
     */
    @Transactional
    public MaintenanceGenerationRun generateTasksForScheduler(Long id, LocalDate windowStart, LocalDate windowEnd) {
        MaintenancePolicyRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found"));
        return generateTasksForRule(id, rule.getHospitalId(), windowStart, windowEnd);
    }

    private MaintenanceGenerationRun generateTasksForRule(Long id, Long hospitalId, LocalDate windowStart, LocalDate windowEnd) {
        // Manual and scheduled generation share this row lock. It protects both the run ledger and
        // the generated-task cadence from overlapping transactions for the same rule.
        MaintenancePolicyRule rule = ruleRepository.findByIdAndHospitalIdForUpdate(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance rule not found or access denied"));
        if (!Boolean.TRUE.equals(rule.getActive())) {
            throw new IllegalArgumentException("Inactive maintenance rules cannot generate tasks");
        }

        LocalDate start = windowStart != null ? windowStart : LocalDate.now();
        LocalDate end = windowEnd != null ? windowEnd : start.plusDays(rule.getLeadTimeDays());
        validateWindow(start, end);

        // Idempotency: a prior run for exactly this window short-circuits before any work is done.
        Optional<MaintenanceGenerationRun> prior = runRepository
                .findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(hospitalId, rule.getId(), start, end);
        if (prior.isPresent()) {
            return prior.get();
        }

        GenerationPlan plan = buildGenerationPlan(rule, hospitalId, start, end);

        List<MaintenanceTask> createdTasks = new ArrayList<>();
        for (PlannedOccurrence occurrence : plan.occurrences()) {
            Equipment equipment = occurrence.equipment();
            MaintenanceTask task = MaintenanceTask.builder()
                    .taskCode("MNT-" + UUID.randomUUID())
                    .equipmentId(equipment.getEquipmentCode())
                    .equipment(equipment.getName())
                    .equipmentRecord(equipment)
                    .hospital(equipment.getHospital() != null ? equipment.getHospital().getName() : null)
                    .hospitalId(hospitalId)
                    .maintenanceType(rule.getMaintenanceType())
                    .deadline(occurrence.deadline())
                    .description("Automatically generated by rule '" + rule.getName() + "'")
                    .priority(resolveTaskPriority(rule))
                    .status(MaintenanceStatus.SCHEDULED)
                    .policyRuleId(rule.getId())
                    .slaState(SlaState.UPCOMING)
                    .createdAt(LocalDateTime.now())
                    .build();
            createdTasks.add(task);
        }

        MaintenanceGenerationRun run = MaintenanceGenerationRun.builder()
                .hospitalId(hospitalId)
                .policyRuleId(rule.getId())
                .windowStart(start)
                .windowEnd(end)
                .tasksGenerated(createdTasks.size())
                .skippedExisting(plan.skippedExisting())
                .detail("Generated for rule '" + rule.getName() + "'")
                .createdAt(LocalDateTime.now())
                .build();
        MaintenanceGenerationRun savedRun = runRepository.save(run);

        for (MaintenanceTask task : createdTasks) {
            task.setGenerationRunId(savedRun.getId());
        }
        taskRepository.saveAll(createdTasks);
        for (MaintenanceTask task : createdTasks) {
            activityService.recordSystemCreated(
                    task, "by preventive-maintenance rule " + rule.getId());
        }

        // This field records the latest successfully evaluated horizon for operators. Cadence is
        // intentionally anchored to retained task deadlines instead of this mutable run metadata.
        rule.setLastGeneratedAt(end);
        rule.setUpdatedAt(LocalDateTime.now());
        ruleRepository.save(rule);

        log.info("Rule '{}' generated {} tasks (skipped {}) for hospital {} window {}..{}",
                rule.getName(), createdTasks.size(), plan.skippedExisting(), hospitalId, start, end);
        return savedRun;
    }

    // ------------------------------------------------------------------
    // SLA + escalation
    // ------------------------------------------------------------------

    /**
     * Recomputes SLA state for every open task of the hospital and applies escalation rules for
     * breached critical tasks and unassigned high-priority tasks.
     */
    @Transactional
    public SlaSummaryResponse refreshSla(Authentication authentication) {
        Hospital hospital = getHospitalForUser(authentication);
        return refreshSlaForHospital(hospital);
    }

    /**
     * Hospital-agnostic entry point for {@link MaintenanceSlaAlertScheduler}: recomputes SLA
     * state and escalation for one hospital without an {@link Authentication}, so the scheduler
     * can sweep every hospital on a timer instead of only when a user opens the SLA dashboard.
     */
    @Transactional
    public SlaSummaryResponse refreshSlaForHospitalId(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));
        return refreshSlaForHospital(hospital);
    }

    private SlaSummaryResponse refreshSlaForHospital(Hospital hospital) {
        Long hospitalId = hospital.getId();
        List<MaintenanceTask> openTasks = taskRepository.findByHospitalId(hospitalId).stream()
                .filter(task -> task.getStatus() != MaintenanceStatus.COMPLETED)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        for (MaintenanceTask task : openTasks) {
            SlaState previousState = task.getSlaState();
            computeSlaState(task, now);
            taskRepository.save(task);
            if (task.getSlaState() != previousState) {
                publishSlaTransitionEvent(task);
            }
        }

        // Escalate overdue critical tasks to the hospital account.
        List<MaintenanceTask> breachedCritical = taskRepository
                .findByHospitalIdAndSlaStateAndStatusNot(hospitalId, SlaState.BREACHED, MaintenanceStatus.COMPLETED).stream()
                .filter(task -> "Critical".equalsIgnoreCase(task.getPriority()))
                .toList();
        User hospitalUser = hospital.getUser();
        for (MaintenanceTask task : breachedCritical) {
            if (task.getSlaState() != SlaState.ESCALATED) {
                task.setSlaState(SlaState.ESCALATED);
                task.setEscalatedTo(hospitalUser != null ? hospitalUser.getEmail() : null);
                taskRepository.save(task);
                activityService.recordSystemCreated(task, "escalated due to critical SLA breach");
            }
        }

        // Escalate unassigned high-priority tasks that are already breached.
        for (MaintenanceTask task : taskRepository.findUnassignedByPriority(
                hospitalId, MaintenanceStatus.COMPLETED, SUGGESTION_PRIORITIES)) {
            if (task.getSlaState() == SlaState.BREACHED && task.getEscalatedTo() == null) {
                task.setSlaState(SlaState.ESCALATED);
                task.setEscalatedTo(hospitalUser != null ? hospitalUser.getEmail() : null);
                taskRepository.save(task);
                activityService.recordSystemCreated(task, "escalated due to unassigned SLA breach");
            }
        }

        return buildSlaSummary(hospitalId);
    }

    /**
     * Publishes the SLA-category event for a task's new state, and mirrors a breach into the
     * maintenance feed as {@code MAINTENANCE_OVERDUE} - the same underlying fact ("this task
     * missed its deadline") matters to both the SLA and maintenance Activity Center tabs.
     */
    private void publishSlaTransitionEvent(MaintenanceTask task) {
        if (task.getSlaState() == SlaState.WARNING) {
            eventPublisherService.publishEvent(
                    task.getHospitalId(),
                    OperationsEvent.EventCategory.SLA,
                    OperationsEvent.EventType.SLA_WARNING,
                    "SLA warning: " + task.getEquipment(),
                    slaEventDetail(task),
                    task.getId(),
                    OperationsEvent.EntityType.MAINTENANCE_TASK,
                    "system",
                    OperationsEvent.EventSeverity.WARNING);
        } else if (task.getSlaState() == SlaState.BREACHED) {
            eventPublisherService.publishEvent(
                    task.getHospitalId(),
                    OperationsEvent.EventCategory.SLA,
                    OperationsEvent.EventType.SLA_BREACHED,
                    "SLA breached: " + task.getEquipment(),
                    slaEventDetail(task),
                    task.getId(),
                    OperationsEvent.EntityType.MAINTENANCE_TASK,
                    "system",
                    OperationsEvent.EventSeverity.CRITICAL);
            eventPublisherService.publishEvent(
                    task.getHospitalId(),
                    OperationsEvent.EventCategory.MAINTENANCE,
                    OperationsEvent.EventType.MAINTENANCE_OVERDUE,
                    "Overdue: " + task.getEquipment(),
                    slaEventDetail(task),
                    task.getId(),
                    OperationsEvent.EntityType.MAINTENANCE_TASK,
                    "system",
                    OperationsEvent.EventSeverity.WARNING);
        }
    }

    private void publishSlaEscalatedEvent(MaintenanceTask task) {
        eventPublisherService.publishEvent(
                task.getHospitalId(),
                OperationsEvent.EventCategory.SLA,
                OperationsEvent.EventType.SLA_ESCALATED,
                "SLA escalated: " + task.getEquipment(),
                slaEventDetail(task),
                task.getId(),
                OperationsEvent.EntityType.MAINTENANCE_TASK,
                "system",
                OperationsEvent.EventSeverity.CRITICAL);
    }

    private String slaEventDetail(MaintenanceTask task) {
        return "{"
                + "\"taskCode\":\"" + (task.getTaskCode() != null ? task.getTaskCode() : "") + "\","
                + "\"priority\":\"" + (task.getPriority() != null ? task.getPriority() : "") + "\","
                + "\"deadline\":\"" + (task.getDeadline() != null ? task.getDeadline() : "") + "\""
                + "}";
    }

    private void computeSlaState(MaintenanceTask task, LocalDateTime now) {
        if (task.getDeadline() == null) {
            task.setSlaState(SlaState.UPCOMING);
            return;
        }
        LocalDate deadline = task.getDeadline();
        LocalDateTime warningAt = deadline.minusDays(warningDaysFor(task)).atStartOfDay();
        LocalDateTime breachAt = deadline.plusDays(breachDaysFor(task)).atTime(23, 59, 59);

        task.setSlaWarningAt(warningAt);
        task.setSlaBreachedAt(breachAt);

        if (now.isAfter(breachAt)) {
            task.setSlaState(SlaState.BREACHED);
        } else if (now.isAfter(warningAt)) {
            task.setSlaState(SlaState.WARNING);
        } else {
            task.setSlaState(SlaState.UPCOMING);
        }
    }

    private int warningDaysFor(MaintenanceTask task) {
        return ruleFor(task).map(MaintenancePolicyRule::getSlaWarningDays).orElse(3);
    }

    private int breachDaysFor(MaintenanceTask task) {
        return ruleFor(task).map(MaintenancePolicyRule::getSlaBreachDays).orElse(1);
    }

    private Optional<MaintenancePolicyRule> ruleFor(MaintenanceTask task) {
        if (task.getPolicyRuleId() == null) {
            return Optional.empty();
        }
        return ruleRepository.findById(task.getPolicyRuleId());
    }

    public SlaSummaryResponse getSlaSummary(Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();
        return buildSlaSummary(hospitalId);
    }

    private SlaSummaryResponse buildSlaSummary(Long hospitalId) {
        long upcoming = taskRepository.countByHospitalIdAndSlaStateAndStatusNot(
                hospitalId, SlaState.UPCOMING, MaintenanceStatus.COMPLETED);
        long warning = taskRepository.countByHospitalIdAndSlaStateAndStatusNot(
                hospitalId, SlaState.WARNING, MaintenanceStatus.COMPLETED);
        long breached = taskRepository.countByHospitalIdAndSlaStateAndStatusNot(
                hospitalId, SlaState.BREACHED, MaintenanceStatus.COMPLETED);
        long escalated = taskRepository.countByHospitalIdAndSlaStateAndStatusNot(
                hospitalId, SlaState.ESCALATED, MaintenanceStatus.COMPLETED);

        long completedTotal = taskRepository.countByHospitalIdAndStatus(hospitalId, MaintenanceStatus.COMPLETED);
        long completedOnTime = taskRepository
                .findCompletedTasksWithTimestamps(hospitalId, MaintenanceStatus.COMPLETED).stream()
                .filter(task -> task.getCompletedAt() != null && task.getDeadline() != null
                        && !task.getCompletedAt().toLocalDate().isAfter(task.getDeadline()))
                .count();
        long completedLate = Math.max(0, completedTotal - completedOnTime);
        double complianceRate = completedTotal > 0 ? (completedOnTime * 100.0) / completedTotal : 0.0;

        return SlaSummaryResponse.builder()
                .upcoming(upcoming)
                .warning(warning)
                .breached(breached)
                .escalated(escalated)
                .completedOnTime(completedOnTime)
                .completedLate(completedLate)
                .complianceRate(Math.round(complianceRate * 100.0) / 100.0)
                .warningTasks(taskRepository.findByHospitalIdAndSlaStateAndStatusNot(
                        hospitalId, SlaState.WARNING, MaintenanceStatus.COMPLETED))
                .breachedTasks(taskRepository.findByHospitalIdAndSlaStateAndStatusNot(
                        hospitalId, SlaState.BREACHED, MaintenanceStatus.COMPLETED))
                .escalatedTasks(taskRepository.findByHospitalIdAndSlaStateAndStatusNot(
                        hospitalId, SlaState.ESCALATED, MaintenanceStatus.COMPLETED))
                .build();
    }

    // ------------------------------------------------------------------
    // Technician workload + suggestions
    // ------------------------------------------------------------------

    public TechnicianWorkloadResponse getTechnicianWorkload(Authentication authentication) {
        Long hospitalId = getHospitalForUser(authentication).getId();

        Map<Long, TechnicianWorkloadResponse.TechnicianWorkloadItem> workload = new HashMap<>();
        for (Object[] row : taskRepository.findOpenWorkloadByTechnician(hospitalId, MaintenanceStatus.COMPLETED)) {
            Long technicianId = (Long) row[0];
            String technicianEmail = (String) row[1];
            long openTasks = ((Number) row[2]).longValue();
            workload.put(technicianId, TechnicianWorkloadResponse.TechnicianWorkloadItem.builder()
                    .technicianId(technicianId)
                    .technicianEmail(technicianEmail)
                    .openTasks(openTasks)
                    .build());
        }

        // Include active technicians that currently hold no open tasks.
        for (User technician : userRepository.findByRoleAndAccountStatus("technician", AccountStatus.ACTIVE)) {
            workload.computeIfAbsent(technician.getId(), id -> TechnicianWorkloadResponse.TechnicianWorkloadItem.builder()
                    .technicianId(technician.getId())
                    .technicianEmail(technician.getEmail())
                    .openTasks(0)
                    .build());
        }

        List<TechnicianWorkloadResponse.TechnicianWorkloadItem> technicians = workload.values().stream()
                .sorted(Comparator.comparingLong(TechnicianWorkloadResponse.TechnicianWorkloadItem::getOpenTasks)
                        .thenComparing(TechnicianWorkloadResponse.TechnicianWorkloadItem::getTechnicianEmail))
                .toList();

        List<TechnicianWorkloadResponse.AssignmentSuggestion> suggestions = new ArrayList<>();
        for (MaintenanceTask task : taskRepository.findUnassignedByPriority(
                hospitalId, MaintenanceStatus.COMPLETED, SUGGESTION_PRIORITIES)) {
            Optional<TechnicianWorkloadResponse.TechnicianWorkloadItem> target = technicians.stream()
                    .filter(item -> !"Critical".equalsIgnoreCase(task.getPriority()) || item.getOpenTasks() < 5)
                    .min(Comparator.comparingLong(TechnicianWorkloadResponse.TechnicianWorkloadItem::getOpenTasks));
            target.ifPresent(item -> suggestions.add(TechnicianWorkloadResponse.AssignmentSuggestion.builder()
                    .taskId(task.getId())
                    .taskCode(task.getTaskCode())
                    .equipment(task.getEquipment())
                    .priority(task.getPriority())
                    .deadline(task.getDeadline())
                    .suggestedTechnicianId(item.getTechnicianId())
                    .suggestedTechnicianEmail(item.getTechnicianEmail())
                    .suggestedTechnicianOpenTasks(item.getOpenTasks())
                    .reason("Least loaded technician for " + task.getPriority() + " priority work")
                    .build()));
        }

        return TechnicianWorkloadResponse.builder()
                .technicians(technicians)
                .suggestions(suggestions)
                .build();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private List<Equipment> matchEquipment(MaintenancePolicyRule rule, Long hospitalId) {
        switch (rule.getRuleScope()) {
            case EQUIPMENT_CATEGORY:
                if (rule.getEquipmentCategory() == null) {
                    throw new IllegalArgumentException("Equipment category rules require an equipment category");
                }
                return equipmentRepository.findByHospitalIdAndCategory(hospitalId, rule.getEquipmentCategory());
            case INDIVIDUAL_EQUIPMENT:
                if (rule.getEquipmentRecordId() == null) {
                    throw new IllegalArgumentException("Individual equipment rules require an equipment record");
                }
                return equipmentRepository.findByIdAndHospitalId(rule.getEquipmentRecordId(), hospitalId)
                        .map(List::of).orElse(List.of());
            case MANUFACTURER_INTERVAL:
                if (rule.getManufacturer() == null || rule.getManufacturer().isBlank()) {
                    throw new IllegalArgumentException("Manufacturer interval rules require a manufacturer");
                }
                return equipmentRepository.findByHospitalIdAndManufacturer(hospitalId, rule.getManufacturer().trim());
            case PRIORITY:
                // Priority-scoped rules apply to every active asset of the hospital.
                return equipmentRepository.findByHospitalId(hospitalId);
            default:
                return List.of();
        }
    }

    private GenerationPlan buildGenerationPlan(
            MaintenancePolicyRule rule,
            Long hospitalId,
            LocalDate start,
            LocalDate end) {
        List<Equipment> matchedEquipment = matchEquipment(rule, hospitalId).stream()
                .filter(this::isEligibleForGeneratedMaintenance)
                .toList();

        Map<Long, LocalDate> latestDeadlineByEquipment = new HashMap<>();
        for (MaintenanceTaskRepository.GeneratedOccurrence occurrence
                : taskRepository.findLatestGeneratedDeadlines(hospitalId, rule.getId())) {
            if (occurrence.getEquipmentRecordId() != null && occurrence.getDeadline() != null) {
                latestDeadlineByEquipment.merge(
                        occurrence.getEquipmentRecordId(),
                        occurrence.getDeadline(),
                        (left, right) -> left.isAfter(right) ? left : right);
            }
        }

        Set<Long> matchedEquipmentIds = matchedEquipment.stream()
                .map(Equipment::getId)
                .collect(java.util.stream.Collectors.toSet());
        Set<OccurrenceKey> existingInWindow = new LinkedHashSet<>();
        for (MaintenanceTaskRepository.GeneratedOccurrence occurrence
                : taskRepository.findGeneratedOccurrencesInWindow(
                        hospitalId, rule.getId(), start, end)) {
            if (occurrence.getEquipmentRecordId() != null
                    && occurrence.getDeadline() != null
                    && matchedEquipmentIds.contains(occurrence.getEquipmentRecordId())) {
                existingInWindow.add(new OccurrenceKey(
                        occurrence.getEquipmentRecordId(), occurrence.getDeadline()));
            }
        }

        List<PlannedOccurrence> plannedOccurrences = new ArrayList<>();
        Set<LocalDate> dueDates = new LinkedHashSet<>();
        for (Equipment equipment : matchedEquipment) {
            LocalDate latestDeadline = latestDeadlineByEquipment.get(equipment.getId());
            for (LocalDate deadline : computeDueDates(rule, start, end, latestDeadline)) {
                if (!existingInWindow.contains(new OccurrenceKey(equipment.getId(), deadline))) {
                    plannedOccurrences.add(new PlannedOccurrence(equipment, deadline));
                }
                dueDates.add(deadline);
            }
        }

        return new GenerationPlan(
                matchedEquipment,
                List.copyOf(plannedOccurrences),
                dueDates.stream().sorted().toList(),
                existingInWindow.size());
    }

    private boolean isEligibleForGeneratedMaintenance(Equipment equipment) {
        return equipment != null
                && equipment.getId() != null
                && equipment.getStatus() != EquipmentStatus.RETIRED
                && equipment.getStatus() != EquipmentStatus.DISPOSED;
    }

    private List<LocalDate> computeDueDates(
            MaintenancePolicyRule rule,
            LocalDate start,
            LocalDate end,
            LocalDate latestGeneratedDeadline) {
        validateWindow(start, end);
        List<LocalDate> dueDates = new ArrayList<>();
        LocalDate cursor = latestGeneratedDeadline == null
                ? start
                : nextOccurrence(latestGeneratedDeadline, rule);
        int safety = 0;

        while (cursor.isBefore(start) && safety < MAX_OCCURRENCES_PER_EQUIPMENT) {
            cursor = nextOccurrence(cursor, rule);
            safety++;
        }
        if (cursor.isBefore(start)) {
            throw new IllegalArgumentException(
                    "Generation cadence requires more than "
                            + MAX_OCCURRENCES_PER_EQUIPMENT
                            + " occurrences to reach the requested window");
        }
        while (!cursor.isAfter(end) && safety < MAX_OCCURRENCES_PER_EQUIPMENT) {
            dueDates.add(cursor);
            cursor = nextOccurrence(cursor, rule);
            safety++;
        }
        if (!cursor.isAfter(end)) {
            throw new IllegalArgumentException(
                    "Generation window contains more than "
                            + MAX_OCCURRENCES_PER_EQUIPMENT
                            + " occurrences for one equipment record");
        }
        return List.copyOf(dueDates);
    }

    private LocalDate nextOccurrence(LocalDate current, MaintenancePolicyRule rule) {
        RecurrenceFrequency frequency = rule.getFrequency();
        if (frequency == null) {
            return current.plusDays(1);
        }
        return switch (frequency) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusWeeks(1);
            case MONTHLY -> current.with(TemporalAdjusters.firstDayOfNextMonth());
            case QUARTERLY -> current.with(TemporalAdjusters.firstDayOfNextMonth())
                    .plusMonths(2);
            case YEARLY -> current.with(TemporalAdjusters.firstDayOfNextMonth())
                    .plusMonths(11);
            case CUSTOM -> current.plusDays(rule.getCustomIntervalDays() != null ? rule.getCustomIntervalDays() : 7);
        };
    }

    private String resolveTaskPriority(MaintenancePolicyRule rule) {
        if (rule.getPriority() != null && !rule.getPriority().isBlank()) {
            return rule.getPriority();
        }
        return "Normal";
    }

    private Integer resolveIntervalDays(MaintenanceRuleRequest request) {
        if (request.getFrequency() == RecurrenceFrequency.CUSTOM) {
            if (request.getCustomIntervalDays() == null) {
                throw new IllegalArgumentException("Custom recurrence requires a custom interval in days");
            }
            return request.getCustomIntervalDays();
        }
        return request.getCustomIntervalDays();
    }

    private String resolveEquipmentName(MaintenancePolicyRule rule) {
        if (rule.getEquipmentRecordId() == null) {
            return null;
        }
        return equipmentRepository.findById(rule.getEquipmentRecordId())
                .map(Equipment::getName).orElse(null);
    }

    private void validateRule(MaintenanceRuleRequest request, Long hospitalId) {
        if (request.getRuleScope() == MaintenanceRuleScope.EQUIPMENT_CATEGORY && request.getEquipmentCategory() == null) {
            throw new IllegalArgumentException("Equipment category rules require an equipment category");
        }
        if (request.getRuleScope() == MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT) {
            if (request.getEquipmentRecordId() == null) {
                throw new IllegalArgumentException("Individual equipment rules require an equipment record");
            }
            Equipment equipment = equipmentRepository.findByIdAndHospitalId(request.getEquipmentRecordId(), hospitalId)
                    .orElseThrow(() -> new IllegalArgumentException("Equipment record not found or access denied for hospital"));
            if (equipment.getStatus() == EquipmentStatus.RETIRED || equipment.getStatus() == EquipmentStatus.DISPOSED) {
                throw new IllegalArgumentException("Retired or disposed equipment cannot be scheduled for preventive maintenance");
            }
        }
        if (request.getRuleScope() == MaintenanceRuleScope.MANUFACTURER_INTERVAL
                && (request.getManufacturer() == null || request.getManufacturer().isBlank())) {
            throw new IllegalArgumentException("Manufacturer interval rules require a manufacturer");
        }
        if (request.getFrequency() == RecurrenceFrequency.CUSTOM
                && (request.getCustomIntervalDays() == null || request.getCustomIntervalDays() <= 0)) {
            throw new IllegalArgumentException("Custom recurrence requires a positive custom interval in days");
        }
    }

    private void validateWindow(LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isAfter(end)) {
            throw new IllegalArgumentException("Window start must not be after window end");
        }
        if (end.isBefore(LocalDate.now().minusDays(1))) {
            throw new IllegalArgumentException("Generation window cannot be entirely in the past");
        }
    }

    private Hospital getHospitalForUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase(java.util.Locale.ROOT))
                .orElseThrow(() -> new AccessDeniedException("An active hospital account is required"));
        if (!"hospital".equalsIgnoreCase(user.getRole()) || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
    }

    private record OccurrenceKey(Long equipmentRecordId, LocalDate deadline) {
    }

    private record PlannedOccurrence(Equipment equipment, LocalDate deadline) {
    }

    private record GenerationPlan(
            List<Equipment> matchedEquipment,
            List<PlannedOccurrence> occurrences,
            List<LocalDate> dueDates,
            int skippedExisting) {
    }
}
