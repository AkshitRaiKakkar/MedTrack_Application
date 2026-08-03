package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.RulePreviewResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceGenerationRun;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.RecurrenceFrequency;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
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
