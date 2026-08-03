package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceActivityPageResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceActivityType;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceTaskActivity;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskActivityRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceActivityServiceTest {
    @Mock private MaintenanceTaskActivityRepository activityRepository;
    @Mock private MaintenanceTaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private Authentication authentication;

    private MaintenanceActivityService service;
    private MaintenanceTask task;
    private User hospitalUser;
    private User technician;

    @BeforeEach
    void setUp() {
        service = new MaintenanceActivityService(
                activityRepository, taskRepository, userRepository, hospitalRepository);
        hospitalUser = user(1L, "hospital@medtrack.com", "hospital");
        technician = user(2L, "tech@medtrack.com", "technician");
        task = MaintenanceTask.builder().id(42L).taskCode("MNT-42").hospitalId(7L)
                .status(MaintenanceStatus.SCHEDULED)
                .assignedTechnician("tech@medtrack.com").build();
    }

    @Test
    void creationCapturesSequenceActorAndSnapshot() {
        when(activityRepository.findLastSequenceNumber(42L)).thenReturn(2L);
        service.recordCreated(task, hospitalUser, "manually");

        MaintenanceTaskActivity saved = captureSaved();
        assertEquals(3L, saved.getSequenceNumber());
        assertEquals(MaintenanceActivityType.TASK_CREATED, saved.getEventType());
        assertEquals("hospital@medtrack.com", saved.getActorEmail());
        assertEquals("HOSPITAL", saved.getActorRole());
        assertEquals(MaintenanceStatus.SCHEDULED, saved.getNewStatus());
        assertEquals("tech@medtrack.com", saved.getNewAssignee());
    }

    @Test
    void automationUsesExplicitSystemIdentity() {
        service.recordSystemCreated(task, "by preventive-maintenance rule 11");
        MaintenanceTaskActivity saved = captureSaved();
        assertNull(saved.getActorUserId());
        assertEquals("system@medtrack.internal", saved.getActorEmail());
        assertEquals("SYSTEM", saved.getActorRole());
        assertTrue(saved.getSummary().contains("rule 11"));
    }

    @Test
    void assignmentDistinguishesFirstAssignmentAndReassignment() {
        service.recordAssignment(task, hospitalUser, null, "tech@medtrack.com");
        assertEquals(MaintenanceActivityType.TECHNICIAN_ASSIGNED, captureSaved().getEventType());

        reset(activityRepository);
        service.recordAssignment(task, hospitalUser, "old@medtrack.com", "tech@medtrack.com");
        MaintenanceTaskActivity saved = captureSaved();
        assertEquals(MaintenanceActivityType.TECHNICIAN_REASSIGNED, saved.getEventType());
        assertEquals("old@medtrack.com", saved.getPreviousAssignee());
    }

    @Test
    void technicianUpdateIsAtomicAndNoOpIsNotRecorded() {
        task.setStatus(MaintenanceStatus.COMPLETED);
        service.recordTechnicianUpdate(task, technician, MaintenanceStatus.IN_PROGRESS,
                List.of("status", "hoursWorked", "signature", "completedAt"));
        MaintenanceTaskActivity saved = captureSaved();
        assertEquals(MaintenanceActivityType.STATUS_CHANGED, saved.getEventType());
        assertEquals("status,hoursWorked,signature,completedAt", saved.getChangedFields());

        reset(activityRepository);
        service.recordTechnicianUpdate(task, technician, MaintenanceStatus.COMPLETED, List.of());
        verifyNoInteractions(activityRepository);
    }

    @Test
    void appendRejectsTransientTask() {
        task.setId(null);
        assertThrows(IllegalStateException.class,
                () -> service.recordCreated(task, hospitalUser, "manually"));
        verify(activityRepository, never()).save(any());
    }

    @Test
    void hospitalReadsArchivedOwnedHistoryWithFilterAndPage() {
        authorizeHospital();
        when(taskRepository.countOwnedTaskIncludingArchived(42L, 7L)).thenReturn(1L);
        PageRequest pageable = PageRequest.of(0, 10);
        when(activityRepository.findOwnedHistory(42L, 7L, "STATUS_CHANGED", pageable))
                .thenReturn(new PageImpl<>(List.of(activity()), pageable, 1));

        MaintenanceActivityPageResponse result = service.getHistory(
                42L, "status-changed", 0, 10, authentication);

        assertEquals(1, result.getContent().size());
        assertEquals(List.of("status", "signature"), result.getContent().get(0).getChangedFields());
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void hospitalCannotReadAnotherHospitalsEvidence() {
        authorizeHospital();
        when(taskRepository.countOwnedTaskIncludingArchived(42L, 7L)).thenReturn(0L);
        assertThrows(ResourceNotFoundException.class,
                () -> service.getHistory(42L, null, 0, 10, authentication));
        verify(activityRepository, never()).findOwnedHistory(any(), any(), any(), any());
    }

    @Test
    void technicianHistoryUsesStableAssignmentIdentity() {
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN")))
                .when(authentication).getAuthorities();
        when(authentication.getName()).thenReturn("tech@medtrack.com");
        when(userRepository.findByEmail("tech@medtrack.com")).thenReturn(Optional.of(technician));
        when(taskRepository.findByIdAndAssignedTechnicianId(42L, 2L)).thenReturn(Optional.of(task));
        PageRequest pageable = PageRequest.of(0, 50);
        when(activityRepository.findOwnedHistory(42L, 7L, null, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        assertTrue(service.getHistory(42L, null, null, null, authentication)
                .getContent().isEmpty());
    }

    @Test
    void validationRejectsBadTypePaginationAndInactiveAccount() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getHistory(42L, "unknown", 0, 10, authentication));
        assertThrows(IllegalArgumentException.class,
                () -> service.getHistory(42L, null, -1, 10, authentication));
        assertThrows(IllegalArgumentException.class,
                () -> service.getHistory(42L, null, 0, 101, authentication));

        doReturn(List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")))
                .when(authentication).getAuthorities();
        when(authentication.getName()).thenReturn("hospital@medtrack.com");
        hospitalUser.setAccountStatus(AccountStatus.DISABLED);
        when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(hospitalUser));
        assertThrows(AccessDeniedException.class,
                () -> service.getHistory(42L, null, 0, 10, authentication));
    }

    private void authorizeHospital() {
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")))
                .when(authentication).getAuthorities();
        when(authentication.getName()).thenReturn("hospital@medtrack.com");
        when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(
                Hospital.builder().id(7L).name("General").user(hospitalUser).build()));
    }

    private MaintenanceTaskActivity captureSaved() {
        ArgumentCaptor<MaintenanceTaskActivity> captor =
                ArgumentCaptor.forClass(MaintenanceTaskActivity.class);
        verify(activityRepository).save(captor.capture());
        return captor.getValue();
    }

    private MaintenanceTaskActivity activity() {
        return MaintenanceTaskActivity.builder().id(4L).task(task).taskId(42L).hospitalId(7L)
                .sequenceNumber(4L).eventType(MaintenanceActivityType.STATUS_CHANGED)
                .actorEmail("tech@medtrack.com").actorRole("TECHNICIAN")
                .previousStatus(MaintenanceStatus.IN_PROGRESS).newStatus(MaintenanceStatus.COMPLETED)
                .changedFields("status,signature").summary("Maintenance task status changed")
                .occurredAt(LocalDateTime.of(2026, 8, 3, 10, 30)).build();
    }

    private User user(Long id, String email, String role) {
        return User.builder().id(id).email(email).role(role)
                .accountStatus(AccountStatus.ACTIVE).build();
    }
}
