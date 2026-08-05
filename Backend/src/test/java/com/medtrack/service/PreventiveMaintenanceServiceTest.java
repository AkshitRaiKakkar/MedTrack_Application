package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceRuleRequest;
import com.medtrack.dto.MaintenanceRuleResponse;
import com.medtrack.dto.RulePreviewResponse;
import com.medtrack.dto.SlaSummaryResponse;
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
import com.medtrack.model.RecurrenceFrequency;
import com.medtrack.model.SlaState;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceGenerationRunRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PreventiveMaintenanceServiceTest {

    private static final String HOSPITAL_EMAIL = "hospital@medtrack.com";

    @Mock
    private MaintenancePolicyRuleRepository ruleRepository;

    @Mock
    private MaintenanceGenerationRunRepository runRepository;

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MaintenanceActivityService activityService;

    @Mock
    private EventPublisherService eventPublisherService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PreventiveMaintenanceService service;

    private Hospital hospital;
    private Equipment equipment;
    private MaintenancePolicyRule weeklyRule;

    @BeforeEach
    void setUp() {
        User hospitalUser = User.builder()
                .id(1L)
                .email(HOSPITAL_EMAIL)
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        hospital = Hospital.builder()
                .id(10L)
                .name("Generation Hospital")
                .location("Test Location")
                .user(hospitalUser)
                .build();
        equipment = Equipment.builder()
                .id(100L)
                .equipmentCode("EQ-100")
                .name("MRI Scanner")
                .department("Radiology")
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .build();
        weeklyRule = MaintenancePolicyRule.builder()
                .id(77L)
                .hospitalId(hospital.getId())
                .name("Weekly MRI inspection")
                .ruleScope(MaintenanceRuleScope.PRIORITY)
                .priority("High")
                .frequency(RecurrenceFrequency.WEEKLY)
                .maintenanceType("Preventive inspection")
                .leadTimeDays(14)
                .active(true)
                .build();

        lenient().when(authentication.getName()).thenReturn(HOSPITAL_EMAIL);
        lenient().when(userRepository.findByEmail(HOSPITAL_EMAIL))
                .thenReturn(Optional.of(hospitalUser));
        lenient().when(hospitalRepository.findByUserId(hospitalUser.getId()))
                .thenReturn(Optional.of(hospital));
        lenient().when(equipmentRepository.findByHospitalId(hospital.getId()))
                .thenReturn(List.of(equipment));
    }

    @Test
    void previewCountsExactOccurrencesFromTheLatestGeneratedDeadline() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(14);
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of(occurrence(equipment.getId(), start)));
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(List.of(occurrence(equipment.getId(), start)));

        RulePreviewResponse preview = service.previewRule(
                weeklyRule.getId(), start, end, authentication);

        assertEquals(1, preview.getMatchedEquipment());
        assertEquals(2, preview.getWouldCreate());
        assertEquals(1, preview.getSkippedExisting());
        assertEquals(List.of(start.plusDays(7), start.plusDays(14)), preview.getDueDates());
        assertEquals(2, preview.getTotalDueDates());
        assertEquals(List.of(equipment.getEquipmentCode()), preview.getMatchedEquipmentCodes());
    }

    @Test
    void generationCreatesEveryMissingOccurrenceAndUsesTheRuleLock() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(14);
        when(ruleRepository.findByIdAndHospitalIdForUpdate(
                weeklyRule.getId(), hospital.getId())).thenReturn(Optional.of(weeklyRule));
        when(runRepository.findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(
                hospital.getId(), weeklyRule.getId(), start, end)).thenReturn(Optional.empty());
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of(occurrence(equipment.getId(), start)));
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(List.of(occurrence(equipment.getId(), start)));
        when(runRepository.save(any(MaintenanceGenerationRun.class))).thenAnswer(invocation -> {
            MaintenanceGenerationRun run = invocation.getArgument(0);
            run.setId(900L);
            return run;
        });
        when(taskRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(ruleRepository.save(any(MaintenancePolicyRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MaintenanceGenerationRun run = service.generateTasks(
                weeklyRule.getId(), start, end, authentication);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MaintenanceTask>> tasksCaptor =
                (ArgumentCaptor<List<MaintenanceTask>>) (ArgumentCaptor<?>)
                        ArgumentCaptor.forClass(List.class);
        verify(taskRepository).saveAll(tasksCaptor.capture());
        List<MaintenanceTask> generated = tasksCaptor.getValue();

        assertEquals(2, run.getTasksGenerated());
        assertEquals(1, run.getSkippedExisting());
        assertEquals(List.of(start.plusDays(7), start.plusDays(14)),
                generated.stream().map(MaintenanceTask::getDeadline).toList());
        assertTrue(generated.stream().allMatch(task -> task.getPolicyRuleId().equals(weeklyRule.getId())));
        assertTrue(generated.stream().allMatch(task -> task.getGenerationRunId().equals(run.getId())));
        assertTrue(generated.stream().allMatch(task -> task.getStatus() == MaintenanceStatus.SCHEDULED));
        verify(ruleRepository).findByIdAndHospitalIdForUpdate(
                weeklyRule.getId(), hospital.getId());
    }

    @Test
    void advancingDailySchedulerWindowDoesNotResetAWeeklyCadence() {
        LocalDate latestDeadline = LocalDate.now();
        LocalDate nextWindowStart = latestDeadline.plusDays(1);
        LocalDate nextWindowEnd = latestDeadline.plusDays(6);
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of(occurrence(equipment.getId(), latestDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), nextWindowStart, nextWindowEnd))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(
                weeklyRule.getId(), nextWindowStart, nextWindowEnd, authentication);

        assertEquals(0, preview.getWouldCreate());
        assertTrue(preview.getDueDates().isEmpty());
    }

    @Test
    void monthlyCadenceAdvancesFromThePriorOccurrenceInsteadOfTheWindowStart() {
        LocalDate start = LocalDate.now();
        LocalDate latestDeadline = start.withDayOfMonth(1);
        LocalDate firstExpected = latestDeadline.with(TemporalAdjusters.firstDayOfNextMonth());
        LocalDate secondExpected = firstExpected.with(TemporalAdjusters.firstDayOfNextMonth());
        LocalDate end = secondExpected.plusDays(1);
        weeklyRule.setFrequency(RecurrenceFrequency.MONTHLY);
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of(occurrence(equipment.getId(), latestDeadline)));
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(
                weeklyRule.getId(), start, end, authentication);

        assertEquals(List.of(firstExpected, secondExpected), preview.getDueDates());
        assertEquals(2, preview.getWouldCreate());
    }

    @Test
    void newDailyRuleCreatesEveryOccurrenceInTheInclusiveWindow() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(2);
        weeklyRule.setFrequency(RecurrenceFrequency.DAILY);
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of());
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(List.of());

        RulePreviewResponse preview = service.previewRule(
                weeklyRule.getId(), start, end, authentication);

        assertEquals(List.of(start, start.plusDays(1), end), preview.getDueDates());
        assertEquals(3, preview.getWouldCreate());
    }

    @Test
    void exactWindowRerunReturnsTheExistingRunWithoutGeneratingAgain() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(weeklyRule.getLeadTimeDays());
        MaintenanceGenerationRun existingRun = MaintenanceGenerationRun.builder()
                .id(900L)
                .hospitalId(hospital.getId())
                .policyRuleId(weeklyRule.getId())
                .windowStart(start)
                .windowEnd(end)
                .tasksGenerated(2)
                .skippedExisting(0)
                .build();
        when(ruleRepository.findByIdAndHospitalIdForUpdate(
                weeklyRule.getId(), hospital.getId())).thenReturn(Optional.of(weeklyRule));
        when(runRepository.findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(Optional.of(existingRun));

        MaintenanceGenerationRun result = service.generateTasks(
                weeklyRule.getId(), start, end, authentication);

        assertSame(existingRun, result);
        verify(taskRepository, never()).saveAll(any());
        verify(runRepository, never()).save(any(MaintenanceGenerationRun.class));
    }

    @Test
    void existingOccurrencesInWindowAreSkippedDuringGenerationAndPreview() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(14);
        weeklyRule.setFrequency(RecurrenceFrequency.WEEKLY);
        when(ruleRepository.findByIdAndHospitalIdForUpdate(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(runRepository.findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(
                hospital.getId(), weeklyRule.getId(), start, end)).thenReturn(Optional.empty());
        when(taskRepository.findLatestGeneratedDeadlines(hospital.getId(), weeklyRule.getId()))
                .thenReturn(List.of());
        when(taskRepository.findGeneratedOccurrencesInWindow(
                hospital.getId(), weeklyRule.getId(), start, end))
                .thenReturn(List.of(occurrence(equipment.getId(), start)));
        when(runRepository.save(any(MaintenanceGenerationRun.class))).thenAnswer(invocation -> {
            MaintenanceGenerationRun run = invocation.getArgument(0);
            run.setId(901L);
            return run;
        });
        when(taskRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(ruleRepository.save(any(MaintenancePolicyRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MaintenanceGenerationRun run = service.generateTasks(
                weeklyRule.getId(), start, end, authentication);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MaintenanceTask>> tasksCaptor =
                (ArgumentCaptor<List<MaintenanceTask>>) (ArgumentCaptor<?>)
                        ArgumentCaptor.forClass(List.class);
        verify(taskRepository).saveAll(tasksCaptor.capture());
        List<MaintenanceTask> generated = tasksCaptor.getValue();

        assertEquals(2, run.getTasksGenerated());
        assertEquals(1, run.getSkippedExisting());
        assertEquals(List.of(start.plusDays(7), start.plusDays(14)),
                generated.stream().map(MaintenanceTask::getDeadline).toList());
        assertTrue(generated.stream().noneMatch(task -> task.getDeadline().equals(start)));
    }

    @Test
    void createRuleWithIndividualEquipmentValidatesHospitalOwnership() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Defibrillator check")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(999L)
                .frequency(RecurrenceFrequency.WEEKLY)
                .maintenanceType("Inspection")
                .priority("High")
                .build();
        when(equipmentRepository.findByIdAndHospitalId(999L, hospital.getId()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createRule(request, authentication));

        assertTrue(ex.getMessage().contains("Equipment record not found or access denied"));
    }

    @Test
    void createRuleWithRetiredEquipmentThrowsIllegalArgumentException() {
        Equipment retiredEquipment = Equipment.builder()
                .id(101L)
                .equipmentCode("EQ-101")
                .name("Old X-Ray")
                .status(EquipmentStatus.RETIRED)
                .hospital(hospital)
                .build();
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Retired machine check")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(retiredEquipment.getId())
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Inspection")
                .priority("Normal")
                .build();
        when(equipmentRepository.findByIdAndHospitalId(retiredEquipment.getId(), hospital.getId()))
                .thenReturn(Optional.of(retiredEquipment));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createRule(request, authentication));

        assertTrue(ex.getMessage().contains("Retired or disposed equipment cannot be scheduled"));
    }

    @Test
    void createRuleWithValidIndividualEquipmentSucceeds() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("MRI specialized maintenance")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(equipment.getId())
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Full Calibration")
                .priority("Critical")
                .build();
        when(equipmentRepository.findByIdAndHospitalId(equipment.getId(), hospital.getId()))
                .thenReturn(Optional.of(equipment));
        when(equipmentRepository.findById(equipment.getId()))
                .thenReturn(Optional.of(equipment));
        when(ruleRepository.save(any(MaintenancePolicyRule.class))).thenAnswer(invocation -> {
            MaintenancePolicyRule saved = invocation.getArgument(0);
            saved.setId(105L);
            return saved;
        });

        MaintenanceRuleResponse response = service.createRule(request, authentication);

        assertEquals("MRI specialized maintenance", response.getName());
        assertEquals(equipment.getName(), response.getEquipmentName());
        assertEquals(equipment.getId(), response.getEquipmentRecordId());
    }

    @Test
    void updateRuleValidatesEquipmentOwnershipAndStatus() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Updated rule")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(555L)
                .frequency(RecurrenceFrequency.WEEKLY)
                .maintenanceType("Routine")
                .priority("High")
                .build();
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(equipmentRepository.findByIdAndHospitalId(555L, hospital.getId()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateRule(weeklyRule.getId(), request, authentication));

        assertTrue(ex.getMessage().contains("Equipment record not found or access denied"));
    }

    @Test
    void refreshSlaEscalatesOverdueCriticalTasksAndRecordsActivity() {
        MaintenanceTask criticalTask = MaintenanceTask.builder()
                .id(201L)
                .taskCode("MNT-CRIT-1")
                .hospitalId(hospital.getId())
                .priority("Critical")
                .status(MaintenanceStatus.SCHEDULED)
                .slaState(SlaState.BREACHED)
                .deadline(LocalDate.now().minusDays(2))
                .build();
        when(taskRepository.findByHospitalId(hospital.getId()))
                .thenReturn(List.of(criticalTask));
        when(taskRepository.findByHospitalIdAndSlaStateAndStatusNot(
                hospital.getId(), SlaState.BREACHED, MaintenanceStatus.COMPLETED))
                .thenReturn(List.of(criticalTask));
        when(taskRepository.findUnassignedByPriority(
                hospital.getId(), MaintenanceStatus.COMPLETED, List.of("Critical", "High")))
                .thenReturn(List.of());

        SlaSummaryResponse summary = service.refreshSla(authentication);

        assertEquals(SlaState.ESCALATED, criticalTask.getSlaState());
        assertEquals(HOSPITAL_EMAIL, criticalTask.getEscalatedTo());
        verify(taskRepository, org.mockito.Mockito.atLeastOnce()).save(criticalTask);
        verify(activityService).recordSystemCreated(
                criticalTask, "escalated due to critical SLA breach");
    }

    @Test
    void createRuleWithManufacturerScopeRequiresManufacturer() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Manufacturer rule without manufacturer")
                .ruleScope(MaintenanceRuleScope.MANUFACTURER_INTERVAL)
                .manufacturer("   ")
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Inspection")
                .priority("Normal")
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createRule(request, authentication));

        assertTrue(ex.getMessage().contains("Manufacturer interval rules require a manufacturer"));
    }

    @Test
    void createRuleWithCategoryScopeRequiresCategory() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Category rule without category")
                .ruleScope(MaintenanceRuleScope.EQUIPMENT_CATEGORY)
                .equipmentCategory(null)
                .frequency(RecurrenceFrequency.WEEKLY)
                .maintenanceType("Inspection")
                .priority("Normal")
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createRule(request, authentication));

        assertTrue(ex.getMessage().contains("Equipment category rules require an equipment category"));
    }

    @Test
    void createRuleWithCustomFrequencyRequiresPositiveInterval() {
        MaintenanceRuleRequest request = MaintenanceRuleRequest.builder()
                .name("Custom interval rule")
                .ruleScope(MaintenanceRuleScope.PRIORITY)
                .frequency(RecurrenceFrequency.CUSTOM)
                .customIntervalDays(0)
                .maintenanceType("Inspection")
                .priority("Normal")
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createRule(request, authentication));

        assertTrue(ex.getMessage().contains("Custom recurrence requires a positive custom interval"));
    }

    @Test
    void generateTasksForInactiveRuleThrowsIllegalArgumentException() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(7);
        weeklyRule.setActive(false);
        when(ruleRepository.findByIdAndHospitalIdForUpdate(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.generateTasks(weeklyRule.getId(), start, end, authentication));

        assertTrue(ex.getMessage().contains("Inactive maintenance rules cannot generate tasks"));
    }

    @Test
    void refreshSlaEscalatesUnassignedHighPriorityBreachedTasksAndRecordsActivity() {
        MaintenanceTask highPriorityTask = MaintenanceTask.builder()
                .id(302L)
                .taskCode("MNT-HIGH-1")
                .hospitalId(hospital.getId())
                .priority("High")
                .status(MaintenanceStatus.SCHEDULED)
                .slaState(SlaState.BREACHED)
                .assignedTechnician(null)
                .deadline(LocalDate.now().minusDays(3))
                .build();
        when(taskRepository.findByHospitalId(hospital.getId()))
                .thenReturn(List.of(highPriorityTask));
        when(taskRepository.findByHospitalIdAndSlaStateAndStatusNot(
                hospital.getId(), SlaState.BREACHED, MaintenanceStatus.COMPLETED))
                .thenReturn(List.of());
        when(taskRepository.findUnassignedByPriority(
                hospital.getId(), MaintenanceStatus.COMPLETED, List.of("Critical", "High")))
                .thenReturn(List.of(highPriorityTask));

        SlaSummaryResponse summary = service.refreshSla(authentication);

        assertEquals(SlaState.ESCALATED, highPriorityTask.getSlaState());
        assertEquals(HOSPITAL_EMAIL, highPriorityTask.getEscalatedTo());
        verify(taskRepository, org.mockito.Mockito.atLeastOnce()).save(highPriorityTask);
        verify(activityService).recordSystemCreated(
                highPriorityTask, "escalated due to unassigned SLA breach");
    }

    @Test
    void deleteRuleSoftDeletesAndSetsAuditFields() {
        when(ruleRepository.findByIdAndHospitalId(weeklyRule.getId(), hospital.getId()))
                .thenReturn(Optional.of(weeklyRule));
        when(ruleRepository.save(any(MaintenancePolicyRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.deleteRule(weeklyRule.getId(), authentication);

        assertTrue(Boolean.TRUE.equals(weeklyRule.getDeleted()));
        assertEquals(HOSPITAL_EMAIL, weeklyRule.getDeletedBy());
        verify(ruleRepository).save(weeklyRule);
    }

    @Test
    void getRuleThrowsResourceNotFoundWhenNotOwned() {
        when(ruleRepository.findByIdAndHospitalId(999L, hospital.getId()))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.getRule(999L, authentication));
    }

    private MaintenanceTaskRepository.GeneratedOccurrence occurrence(
            Long equipmentRecordId,
            LocalDate deadline) {
        return new MaintenanceTaskRepository.GeneratedOccurrence() {
            @Override
            public Long getEquipmentRecordId() {
                return equipmentRecordId;
            }

            @Override
            public LocalDate getDeadline() {
                return deadline;
            }
        };
    }
}
