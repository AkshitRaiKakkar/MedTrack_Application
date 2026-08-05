package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceScheduleAmendmentRequest;
import com.medtrack.dto.MaintenanceScheduleRevisionPageResponse;
import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceScheduleRevision;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.SlaState;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceScheduleRevisionRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceScheduleServiceTest {

    @Mock private MaintenanceTaskRepository taskRepository;
    @Mock private MaintenanceScheduleRevisionRepository revisionRepository;
    @Mock private MaintenancePolicyRuleRepository policyRuleRepository;
    @Mock private UserRepository userRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private MaintenanceActivityService activityService;
    @InjectMocks private MaintenanceScheduleService service;

    private User hospitalUser;
    private User technician;
    private Hospital hospital;
    private MaintenanceTask task;
    private Authentication hospitalAuthentication;
    private Authentication technicianAuthentication;

    @BeforeEach
    void setUp() {
        hospitalUser = User.builder().id(11L).email("hospital@medtrack.com")
                .role("hospital").accountStatus(AccountStatus.ACTIVE).build();
        technician = User.builder().id(22L).email("tech@medtrack.com")
                .role("technician").accountStatus(AccountStatus.ACTIVE).build();
        hospital = Hospital.builder().id(33L).name("General Hospital")
                .user(hospitalUser).build();
        task = MaintenanceTask.builder().id(44L).taskCode("MNT-44")
                .hospitalId(hospital.getId()).equipmentId("EQ-1")
                .deadline(LocalDate.now().plusDays(5)).maintenanceType("Inspection")
                .description("Original instructions").priority("Normal")
                .recurrencePeriodDays(30).status(MaintenanceStatus.SCHEDULED)
                .scheduleRevision(2).assignedTechnician("tech@medtrack.com")
                .assignedTechnicianRecord(technician).build();
        hospitalAuthentication = authentication(
                "hospital@medtrack.com", "ROLE_HOSPITAL");
        technicianAuthentication = authentication(
                "tech@medtrack.com", "ROLE_TECHNICIAN");
    }

    @Test
    void amendSchedulePersistsCompleteSnapshotAndIncrementsRevision() {
        arrangeOwnedHospitalTask();
        when(taskRepository.save(task)).thenReturn(task);
        when(revisionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        LocalDate newDeadline = LocalDate.now().plusDays(12);
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(newDeadline).maintenanceType("  Calibration  ")
                .description("  Updated instructions  ").priority("critical")
                .recurrencePeriodDays(60).reason("Vendor availability changed").build();

        MaintenanceTask result = service.amendSchedule(44L, request, hospitalAuthentication);

        assertSame(task, result);
        assertEquals(newDeadline, task.getDeadline());
        assertEquals("Calibration", task.getMaintenanceType());
        assertEquals("Updated instructions", task.getDescription());
        assertEquals("Critical", task.getPriority());
        assertEquals(60, task.getRecurrencePeriodDays());
        assertEquals(3, task.getScheduleRevision());
        assertEquals(newDeadline.minusDays(3).atStartOfDay(), task.getSlaWarningAt());
        assertEquals(newDeadline.plusDays(1).atTime(23, 59, 59), task.getSlaBreachedAt());
        assertEquals(SlaState.UPCOMING, task.getSlaState());

        ArgumentCaptor<MaintenanceScheduleRevision> revisionCaptor =
                ArgumentCaptor.forClass(MaintenanceScheduleRevision.class);
        verify(revisionRepository).save(revisionCaptor.capture());
        MaintenanceScheduleRevision revision = revisionCaptor.getValue();
        assertSame(task, revision.getTask());
        assertEquals(hospital.getId(), revision.getHospitalId());
        assertEquals(3, revision.getRevisionNumber());
        assertEquals(hospitalUser.getId(), revision.getActorUserId());
        assertEquals("hospital@medtrack.com", revision.getActorEmail());
        assertEquals("Vendor availability changed", revision.getReason());
        assertEquals("deadline,maintenanceType,description,priority,recurrencePeriodDays",
                revision.getChangedFields());
        assertEquals("Inspection", revision.getPreviousMaintenanceType());
        assertEquals("Calibration", revision.getNewMaintenanceType());
        assertEquals("Normal", revision.getPreviousPriority());
        assertEquals("Critical", revision.getNewPriority());
        assertNotNull(revision.getAmendedAt());
        verify(activityService).recordScheduleAmendment(
                task, hospitalUser,
                List.of("deadline", "maintenanceType", "description", "priority",
                        "recurrencePeriodDays"));
    }

    @Test
    void amendScheduleCanClearOptionalDescriptionAndDisableRecurrence() {
        arrangeOwnedHospitalTask();
        when(taskRepository.save(task)).thenReturn(task);

        service.amendSchedule(44L, MaintenanceScheduleAmendmentRequest.builder()
                .description("  ").recurrencePeriodDays(0)
                .reason("Move to on-demand servicing").build(), hospitalAuthentication);

        assertNull(task.getDescription());
        assertEquals(0, task.getRecurrencePeriodDays());
        ArgumentCaptor<MaintenanceScheduleRevision> captor =
                ArgumentCaptor.forClass(MaintenanceScheduleRevision.class);
        verify(revisionRepository).save(captor.capture());
        assertEquals("description,recurrencePeriodDays", captor.getValue().getChangedFields());
        assertEquals("Original instructions", captor.getValue().getPreviousDescription());
        assertNull(captor.getValue().getNewDescription());
    }

    @Test
    void generatedTaskAmendmentUsesOwnedPolicySlaWindows() {
        task.setPolicyRuleId(77L);
        task.setEscalatedTo("hospital@medtrack.com");
        arrangeOwnedHospitalTask();
        MaintenancePolicyRule rule = MaintenancePolicyRule.builder().id(77L)
                .hospitalId(hospital.getId()).slaWarningDays(5).slaBreachDays(2).build();
        when(policyRuleRepository.findByIdAndHospitalId(77L, hospital.getId()))
                .thenReturn(Optional.of(rule));
        when(taskRepository.save(task)).thenReturn(task);
        LocalDate newDeadline = LocalDate.now().plusDays(2);

        service.amendSchedule(44L, MaintenanceScheduleAmendmentRequest.builder()
                .deadline(newDeadline).reason("Policy work rescheduled").build(),
                hospitalAuthentication);

        assertEquals(newDeadline.minusDays(5).atStartOfDay(), task.getSlaWarningAt());
        assertEquals(newDeadline.plusDays(2).atTime(23, 59, 59), task.getSlaBreachedAt());
        assertEquals(SlaState.WARNING, task.getSlaState());
        assertNull(task.getEscalatedTo());
    }

    @Test
    void generatedTaskAmendmentRejectsMissingOrCrossTenantPolicy() {
        task.setPolicyRuleId(77L);
        arrangeOwnedHospitalTask();
        when(policyRuleRepository.findByIdAndHospitalId(77L, hospital.getId()))
                .thenReturn(Optional.empty());

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.amendSchedule(
                        44L, requestWithDeadline(), hospitalAuthentication));

        assertEquals("Generated maintenance task has no owned policy rule", error.getMessage());
        verify(taskRepository, never()).save(any());
        verify(revisionRepository, never()).save(any());
    }

    @Test
    void amendScheduleRejectsNoOpWithoutWritingAuditEvidence() {
        arrangeOwnedHospitalTask();
        MaintenanceScheduleAmendmentRequest request = MaintenanceScheduleAmendmentRequest.builder()
                .deadline(task.getDeadline()).maintenanceType(" Inspection ")
                .description("Original instructions").priority("normal")
                .recurrencePeriodDays(30).reason("No actual change").build();

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.amendSchedule(44L, request, hospitalAuthentication));

        assertEquals("Schedule amendment must change at least one scheduling field",
                error.getMessage());
        verify(taskRepository, never()).save(any());
        verify(revisionRepository, never()).save(any());
        verifyNoInteractions(activityService);
    }

    @Test
    void amendScheduleRejectsTaskAfterWorkStarts() {
        task.setStatus(MaintenanceStatus.IN_PROGRESS);
        arrangeOwnedHospitalTask();

        InvalidStatusTransitionException error = assertThrows(
                InvalidStatusTransitionException.class,
                () -> service.amendSchedule(44L, requestWithDeadline(), hospitalAuthentication));

        assertEquals("Schedule can only be amended while the task is Scheduled",
                error.getMessage());
        verify(taskRepository, never()).save(any());
        verify(revisionRepository, never()).save(any());
    }

    @Test
    void amendScheduleRejectsBlankReasonPastDeadlineAndInvalidPriority() {
        arrangeOwnedHospitalTask();
        MaintenanceScheduleAmendmentRequest blankReason = MaintenanceScheduleAmendmentRequest
                .builder().deadline(LocalDate.now().plusDays(8)).reason(" ").build();
        assertEquals("Amendment reason is required", assertThrows(
                IllegalArgumentException.class,
                () -> service.amendSchedule(44L, blankReason, hospitalAuthentication)).getMessage());

        MaintenanceScheduleAmendmentRequest pastDeadline = MaintenanceScheduleAmendmentRequest
                .builder().deadline(LocalDate.now().minusDays(1)).reason("Backdate").build();
        assertEquals("Amended deadline cannot be in the past", assertThrows(
                IllegalArgumentException.class,
                () -> service.amendSchedule(44L, pastDeadline, hospitalAuthentication)).getMessage());

        MaintenanceScheduleAmendmentRequest invalidPriority = MaintenanceScheduleAmendmentRequest
                .builder().priority("Urgent").reason("Escalation").build();
        assertEquals("Priority must be Normal, High, or Critical", assertThrows(
                IllegalArgumentException.class,
                () -> service.amendSchedule(44L, invalidPriority, hospitalAuthentication)).getMessage());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void amendScheduleRejectsCrossHospitalOrInconsistentTask() {
        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(hospitalUser.getId()))
                .thenReturn(Optional.of(hospital));
        when(taskRepository.findByIdAndHospitalIdForUpdate(44L, hospital.getId()))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.amendSchedule(44L, requestWithDeadline(), hospitalAuthentication));

        when(taskRepository.findByIdAndHospitalIdForUpdate(44L, hospital.getId()))
                .thenReturn(Optional.of(task));
        when(taskRepository.countValidOwnership(44L, hospital.getId())).thenReturn(0L);
        assertThrows(IllegalStateException.class,
                () -> service.amendSchedule(44L, requestWithDeadline(), hospitalAuthentication));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void hospitalReadsArchivedRevisionHistoryWithBoundedPagination() {
        MaintenanceScheduleRevision revision = revision(3, "deadline");
        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(hospitalUser.getId()))
                .thenReturn(Optional.of(hospital));
        when(taskRepository.countOwnedTaskIncludingArchived(44L, hospital.getId()))
                .thenReturn(1L);
        when(revisionRepository.findOwnedRevisions(
                44L, hospital.getId(), PageRequest.of(1, 20)))
                .thenReturn(new PageImpl<>(List.of(revision), PageRequest.of(1, 20), 45));

        MaintenanceScheduleRevisionPageResponse result = service.getRevisions(
                44L, 1, 20, hospitalAuthentication);

        assertEquals(1, result.getContent().size());
        assertEquals(3, result.getContent().get(0).getRevisionNumber());
        assertEquals(List.of("deadline"), result.getContent().get(0).getChangedFields());
        assertEquals(1, result.getPage());
        assertEquals(20, result.getSize());
        assertEquals(45, result.getTotalElements());
        assertEquals(3, result.getTotalPages());
    }

    @Test
    void assignedTechnicianCanReadButUnassignedTechnicianCannot() {
        when(userRepository.findByEmail("tech@medtrack.com"))
                .thenReturn(Optional.of(technician));
        when(taskRepository.findByIdAndAssignedTechnicianId(44L, technician.getId()))
                .thenReturn(Optional.of(task));
        when(revisionRepository.findOwnedRevisions(
                eq(44L), eq(hospital.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertTrue(service.getRevisions(
                44L, null, null, technicianAuthentication).getContent().isEmpty());

        when(taskRepository.findByIdAndAssignedTechnicianId(44L, technician.getId()))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.getRevisions(44L, null, null, technicianAuthentication));
    }

    @Test
    void revisionHistoryRejectsInvalidPaginationAndInactiveAccounts() {
        assertEquals("Revision page index cannot be negative", assertThrows(
                IllegalArgumentException.class,
                () -> service.getRevisions(44L, -1, 10, hospitalAuthentication)).getMessage());
        assertEquals("Revision page size must be between 1 and 100", assertThrows(
                IllegalArgumentException.class,
                () -> service.getRevisions(44L, 0, 101, hospitalAuthentication)).getMessage());

        hospitalUser.setAccountStatus(AccountStatus.DISABLED);
        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.getRevisions(44L, 0, 10, hospitalAuthentication));
        verifyNoInteractions(revisionRepository);
    }

    private void arrangeOwnedHospitalTask() {
        when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(hospitalUser.getId()))
                .thenReturn(Optional.of(hospital));
        when(taskRepository.findByIdAndHospitalIdForUpdate(44L, hospital.getId()))
                .thenReturn(Optional.of(task));
        lenient().when(taskRepository.countValidOwnership(44L, hospital.getId())).thenReturn(1L);
    }

    private MaintenanceScheduleAmendmentRequest requestWithDeadline() {
        return MaintenanceScheduleAmendmentRequest.builder()
                .deadline(LocalDate.now().plusDays(10)).reason("Planning update").build();
    }

    private MaintenanceScheduleRevision revision(int number, String fields) {
        return MaintenanceScheduleRevision.builder().task(task).hospitalId(hospital.getId())
                .revisionNumber(number).actorUserId(hospitalUser.getId())
                .actorEmail(hospitalUser.getEmail()).reason("Planning update")
                .changedFields(fields).previousDeadline(task.getDeadline())
                .newDeadline(task.getDeadline().plusDays(2))
                .previousMaintenanceType(task.getMaintenanceType())
                .newMaintenanceType(task.getMaintenanceType())
                .previousDescription(task.getDescription())
                .newDescription(task.getDescription())
                .previousPriority(task.getPriority()).newPriority(task.getPriority())
                .previousRecurrencePeriodDays(task.getRecurrencePeriodDays())
                .newRecurrencePeriodDays(task.getRecurrencePeriodDays())
                .amendedAt(LocalDateTime.now()).build();
    }

    private Authentication authentication(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email, "password", List.of(new SimpleGrantedAuthority(role)));
    }
}
