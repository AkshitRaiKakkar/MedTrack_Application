package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceCreateRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceDuplicateTaskTest {

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceActivityService activityService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private User hospitalUser;
    private Hospital hospital;
    private Equipment equipment;
    private Equipment secondEquipment;
    private User technician;

    @BeforeEach
    void setUp() {
        hospitalUser = User.builder()
                .id(1L)
                .username("hospital_user")
                .email("hospital@medtrack.com")
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        hospital = Hospital.builder()
                .id(10L)
                .name("General Hospital")
                .user(hospitalUser)
                .build();

        equipment = Equipment.builder()
                .id(100L)
                .equipmentCode("EQ-VENT-001")
                .name("Ventilator 2000")
                .hospital(hospital)
                .build();

        secondEquipment = Equipment.builder()
                .id(101L)
                .equipmentCode("EQ-PUMP-002")
                .name("Infusion Pump")
                .hospital(hospital)
                .build();

        technician = User.builder()
                .id(2L)
                .username("tech_john")
                .email("tech@medtrack.com")
                .role("technician")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        lenient().when(authentication.getName()).thenReturn("hospital@medtrack.com");
        lenient().doReturn(List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")))
                .when(authentication).getAuthorities();
        lenient().when(userRepository.findByEmail("hospital@medtrack.com"))
                .thenReturn(Optional.of(hospitalUser));
        lenient().when(hospitalRepository.findByUserId(1L))
                .thenReturn(Optional.of(hospital));
    }

    @Test
    @DisplayName("Should reject scheduling task when an active task of the same type exists")
    void shouldRejectDuplicateActiveTaskWhenSchedulingTaskForSameEquipmentAndSameType() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("EQ-VENT-001")
                .maintenanceType("Corrective")
                .deadline(LocalDate.now().plusDays(5))
                .priority("High")
                .description("Fixing pressure sensor issue")
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));
        when(taskRepository.existsActiveTaskForEquipment(
                eq(10L), eq(100L), eq("Corrective"), anyList()))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> maintenanceService.scheduleTask(request, authentication));

        assertTrue(exception.getMessage().contains("An active maintenance task of type 'Corrective' already exists"));
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should perform case-insensitive comparison for maintenance type duplicate checks")
    void shouldRejectDuplicateTaskWithCaseInsensitiveMaintenanceTypeMatching() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("EQ-VENT-001")
                .maintenanceType("corrective")
                .deadline(LocalDate.now().plusDays(3))
                .priority("Normal")
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));
        when(taskRepository.existsActiveTaskForEquipment(
                eq(10L), eq(100L), eq("corrective"), anyList()))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> maintenanceService.scheduleTask(request, authentication));

        assertTrue(exception.getMessage().contains("An active maintenance task of type 'corrective' already exists"));
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow scheduling a new task when no active task exists for the equipment")
    void shouldAllowSchedulingTaskWhenNoActiveTaskExists() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("EQ-VENT-001")
                .maintenanceType("Preventive")
                .deadline(LocalDate.now().plusDays(7))
                .priority("Normal")
                .assignedTechnician("tech@medtrack.com")
                .description("Routine inspection")
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));
        when(userRepository.findByEmail("tech@medtrack.com"))
                .thenReturn(Optional.of(technician));
        when(taskRepository.existsActiveTaskForEquipment(
                eq(10L), eq(100L), eq("Preventive"), anyList()))
                .thenReturn(false);

        MaintenanceTask savedTask = MaintenanceTask.builder()
                .id(500L)
                .taskCode("MNT-12345")
                .equipmentId("EQ-VENT-001")
                .equipment("Ventilator 2000")
                .equipmentRecord(equipment)
                .hospital("General Hospital")
                .hospitalId(10L)
                .maintenanceType("Preventive")
                .deadline(request.getDeadline())
                .assignedTechnician("tech@medtrack.com")
                .assignedTechnicianRecord(technician)
                .priority("Normal")
                .status(MaintenanceStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        when(taskRepository.save(any(MaintenanceTask.class))).thenReturn(savedTask);

        MaintenanceTask createdTask = maintenanceService.scheduleTask(request, authentication);

        assertNotNull(createdTask);
        assertEquals("Preventive", createdTask.getMaintenanceType());
        assertEquals(MaintenanceStatus.SCHEDULED, createdTask.getStatus());
        verify(taskRepository, times(1)).save(any(MaintenanceTask.class));
        verify(activityService, times(1)).recordCreated(eq(savedTask), eq(hospitalUser), eq("manually"));
    }

    @Test
    @DisplayName("Should allow scheduling different maintenance type for the same equipment")
    void shouldAllowSchedulingTasksWithDifferentMaintenanceTypesForSameEquipment() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("EQ-VENT-001")
                .maintenanceType("Calibration")
                .deadline(LocalDate.now().plusDays(2))
                .priority("Critical")
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-VENT-001"))
                .thenReturn(Optional.of(equipment));
        when(taskRepository.existsActiveTaskForEquipment(
                eq(10L), eq(100L), eq("Calibration"), anyList()))
                .thenReturn(false);

        MaintenanceTask savedTask = MaintenanceTask.builder()
                .id(501L)
                .taskCode("MNT-67890")
                .equipmentId("EQ-VENT-001")
                .equipment("Ventilator 2000")
                .equipmentRecord(equipment)
                .hospital("General Hospital")
                .hospitalId(10L)
                .maintenanceType("Calibration")
                .deadline(request.getDeadline())
                .priority("Critical")
                .status(MaintenanceStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        when(taskRepository.save(any(MaintenanceTask.class))).thenReturn(savedTask);

        MaintenanceTask createdTask = maintenanceService.scheduleTask(request, authentication);

        assertNotNull(createdTask);
        assertEquals("Calibration", createdTask.getMaintenanceType());
        verify(taskRepository, times(1)).save(any(MaintenanceTask.class));
    }

    @Test
    @DisplayName("Should allow scheduling same maintenance type for different equipment")
    void shouldAllowSchedulingTaskForDifferentEquipmentWithSameMaintenanceType() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("EQ-PUMP-002")
                .maintenanceType("Corrective")
                .deadline(LocalDate.now().plusDays(4))
                .priority("High")
                .build();

        when(equipmentRepository.findByEquipmentCode("EQ-PUMP-002"))
                .thenReturn(Optional.of(secondEquipment));
        when(taskRepository.existsActiveTaskForEquipment(
                eq(10L), eq(101L), eq("Corrective"), anyList()))
                .thenReturn(false);

        MaintenanceTask savedTask = MaintenanceTask.builder()
                .id(502L)
                .taskCode("MNT-11223")
                .equipmentId("EQ-PUMP-002")
                .equipment("Infusion Pump")
                .equipmentRecord(secondEquipment)
                .hospital("General Hospital")
                .hospitalId(10L)
                .maintenanceType("Corrective")
                .deadline(request.getDeadline())
                .priority("High")
                .status(MaintenanceStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        when(taskRepository.save(any(MaintenanceTask.class))).thenReturn(savedTask);

        MaintenanceTask createdTask = maintenanceService.scheduleTask(request, authentication);

        assertNotNull(createdTask);
        assertEquals("EQ-PUMP-002", createdTask.getEquipmentId());
        verify(taskRepository, times(1)).save(any(MaintenanceTask.class));
    }
}
