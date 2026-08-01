package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers the three overloads of {@code MaintenanceService.getAllTasks} and the callers that depend
 * on each one.
 *
 * <p>These exist because the pagination refactor collapsed all three into a single
 * {@code Pageable}-taking method. That deleted the unpaged overload out from under
 * {@link MaintenanceService#exportTasksToICal(Authentication)}, which broke the build, and it also
 * removed the {@code page}/{@code size} validation that kept an oversized page request from turning
 * into an unbounded scan. Both behaviours are asserted here so a future refactor has to notice
 * them.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MaintenanceService task listing")
class MaintenanceTaskListingTest {

    @Mock
    private MaintenanceTaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private static final String HOSPITAL_EMAIL = "hospital@medtrack.com";
    private static final String TECHNICIAN_EMAIL = "tech@medtrack.com";

    private User hospitalUser;
    private User technicianUser;
    private Hospital hospital;
    private MaintenanceTask task;

    @BeforeEach
    void setUp() {
        hospital = new Hospital();
        hospital.setId(1L);
        hospital.setName("City General");

        hospitalUser = new User();
        hospitalUser.setId(10L);
        hospitalUser.setEmail(HOSPITAL_EMAIL);
        hospitalUser.setRole("hospital");
        hospitalUser.setAccountStatus(AccountStatus.ACTIVE);

        technicianUser = new User();
        technicianUser.setId(20L);
        technicianUser.setEmail(TECHNICIAN_EMAIL);
        technicianUser.setRole("technician");
        technicianUser.setAccountStatus(AccountStatus.ACTIVE);

        Equipment equipment = Equipment.builder()
                .id(100L)
                .equipmentCode("EQ-100")
                .name("MRI Scanner")
                .hospital(hospital)
                .build();

        task = MaintenanceTask.builder()
                .id(50L)
                .taskCode("MNT-0001")
                .equipmentId("EQ-100")
                .equipment("MRI Scanner")
                .equipmentRecord(equipment)
                .hospital("City General")
                .hospitalId(1L)
                .maintenanceType("Inspection")
                .deadline(LocalDate.of(2026, 3, 1))
                .priority("Normal")
                .status(MaintenanceStatus.SCHEDULED)
                .build();
    }

    private void authenticateAsHospital() {
        when(authentication.getName()).thenReturn(HOSPITAL_EMAIL);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_HOSPITAL")))
                .when(authentication).getAuthorities();
        when(userRepository.findByEmail(HOSPITAL_EMAIL)).thenReturn(Optional.of(hospitalUser));
        when(hospitalRepository.findByUserId(hospitalUser.getId())).thenReturn(Optional.of(hospital));
    }

    private void authenticateAsTechnician() {
        when(authentication.getName()).thenReturn(TECHNICIAN_EMAIL);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_TECHNICIAN")))
                .when(authentication).getAuthorities();
        when(userRepository.findByEmail(TECHNICIAN_EMAIL)).thenReturn(Optional.of(technicianUser));
    }

    @Nested
    @DisplayName("unpaged overload")
    class UnpagedOverload {

        @Test
        @DisplayName("returns every task for a hospital caller without touching the paged query")
        void hospitalScopeReturnsEverything() {
            authenticateAsHospital();
            when(taskRepository.findByHospitalId(hospital.getId()))
                    .thenReturn(List.of(task));

            List<MaintenanceTask> result = maintenanceService.getAllTasks(authentication);

            assertEquals(1, result.size());
            assertEquals("MNT-0001", result.get(0).getTaskCode());
            verify(taskRepository).findByHospitalId(hospital.getId());
            verify(taskRepository, never())
                    .findByHospitalIdWithFilters(any(), any(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("scopes a technician caller by their own user ID, not by email")
        void technicianScopeUsesUserId() {
            authenticateAsTechnician();
            when(taskRepository.findByAssignedTechnicianId(technicianUser.getId()))
                    .thenReturn(List.of(task));

            List<MaintenanceTask> result = maintenanceService.getAllTasks(authentication);

            assertEquals(List.of(task), result);
            verify(taskRepository).findByAssignedTechnicianId(technicianUser.getId());
        }

        @Test
        @DisplayName("rejects a role that owns neither view")
        void unknownRoleIsDenied() {
            doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPPLIER")))
                    .when(authentication).getAuthorities();

            assertThrows(AccessDeniedException.class,
                    () -> maintenanceService.getAllTasks(authentication));
            verifyNoInteractions(taskRepository);
        }
    }

    @Nested
    @DisplayName("page/size overload")
    class PageSizeOverload {

        @Test
        @DisplayName("translates page and size into a PageRequest and unwraps the page")
        void translatesPageAndSize() {
            authenticateAsHospital();
            when(taskRepository.findByHospitalIdWithFilters(
                    eq(hospital.getId()),
                    eq(MaintenanceStatus.IN_PROGRESS),
                    eq("EQ-100"),
                    any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(task)));

            List<MaintenanceTask> result = maintenanceService.getAllTasks(
                    authentication, "In Progress", "  EQ-100  ", 2, 25);

            assertEquals(List.of(task), result);

            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            verify(taskRepository).findByHospitalIdWithFilters(
                    eq(hospital.getId()),
                    eq(MaintenanceStatus.IN_PROGRESS),
                    eq("EQ-100"),
                    captor.capture());
            assertEquals(2, captor.getValue().getPageNumber());
            assertEquals(25, captor.getValue().getPageSize());
        }

        @Test
        @DisplayName("treats both numbers being absent as an unpaged request")
        void absentNumbersMeanUnpaged() {
            authenticateAsHospital();
            when(taskRepository.findByHospitalIdWithFilters(
                    eq(hospital.getId()), eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(task)));

            maintenanceService.getAllTasks(authentication, null, null, null, null);

            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            verify(taskRepository).findByHospitalIdWithFilters(
                    eq(hospital.getId()), eq(null), eq(null), captor.capture());
            assertTrue(captor.getValue().isUnpaged(),
                    "no page and no size must mean the whole result set, not page 0");
        }

        @Test
        @DisplayName("rejects an oversized page before the repository is consulted")
        void rejectsOversizedPage() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> maintenanceService.getAllTasks(authentication, null, null, 0, 101));

            assertEquals("Page size must be between 1 and 100", exception.getMessage());
            verifyNoInteractions(taskRepository);
        }

        @Test
        @DisplayName("rejects a negative page index before the repository is consulted")
        void rejectsNegativePage() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> maintenanceService.getAllTasks(authentication, null, null, -1, 10));

            assertEquals("Page index cannot be negative", exception.getMessage());
            verifyNoInteractions(taskRepository);
        }
    }

    @Nested
    @DisplayName("Pageable overload")
    class PageableOverload {

        @Test
        @DisplayName("passes the supplied Pageable straight through for a hospital caller")
        void passesPageableThrough() {
            authenticateAsHospital();
            Pageable pageable = PageRequest.of(1, 5);
            when(taskRepository.findByHospitalIdWithFilters(
                    hospital.getId(), null, null, pageable))
                    .thenReturn(new PageImpl<>(List.of(task), pageable, 6));

            Page<MaintenanceTask> page =
                    maintenanceService.getAllTasks(authentication, null, null, pageable);

            assertEquals(6, page.getTotalElements());
            assertEquals(1, page.getNumber());
            verify(taskRepository).findByHospitalIdWithFilters(
                    hospital.getId(), null, null, pageable);
        }

        @Test
        @DisplayName("passes the supplied Pageable straight through for a technician caller")
        void passesPageableThroughForTechnician() {
            authenticateAsTechnician();
            Pageable pageable = PageRequest.of(0, 5);
            when(taskRepository.findByAssignedTechnicianIdWithFilters(
                    technicianUser.getId(), null, null, pageable))
                    .thenReturn(new PageImpl<>(List.of(task), pageable, 1));

            Page<MaintenanceTask> page =
                    maintenanceService.getAllTasks(authentication, null, null, pageable);

            assertEquals(1, page.getTotalElements());
            verify(taskRepository).findByAssignedTechnicianIdWithFilters(
                    technicianUser.getId(), null, null, pageable);
        }
    }

    @Nested
    @DisplayName("iCal export")
    class ICalExport {

        /**
         * The regression this whole file exists for: the calendar feed is a subscription, so it has
         * to emit every task. If the export is ever re-pointed at a paged overload, the default page
         * size silently truncates the feed and a subscriber's calendar quietly loses events.
         */
        @Test
        @DisplayName("emits one VEVENT per task, past any default page size")
        void exportIsNotTruncatedByAPageSize() {
            authenticateAsHospital();

            List<MaintenanceTask> manyTasks = new ArrayList<>();
            IntStream.rangeClosed(1, 120).forEach(index -> manyTasks.add(
                    MaintenanceTask.builder()
                            .id((long) index)
                            .taskCode("MNT-" + index)
                            .equipment("Asset " + index)
                            .maintenanceType("Inspection")
                            .deadline(LocalDate.of(2026, 3, 1))
                            .priority("Normal")
                            .status(MaintenanceStatus.SCHEDULED)
                            .build()));
            when(taskRepository.findByHospitalId(hospital.getId())).thenReturn(manyTasks);

            String ical = maintenanceService.exportTasksToICal(authentication);

            long eventCount = ical.lines().filter("BEGIN:VEVENT"::equals).count();
            assertEquals(120, eventCount,
                    "every task must reach the feed; a page-shaped read would cap this at 20 or 50");
            assertTrue(ical.startsWith("BEGIN:VCALENDAR\r\n"));
            assertTrue(ical.endsWith("END:VCALENDAR\r\n"));
        }

        @Test
        @DisplayName("skips tasks with no deadline rather than emitting an invalid VEVENT")
        void skipsTasksWithoutADeadline() {
            authenticateAsHospital();
            MaintenanceTask undated = MaintenanceTask.builder()
                    .id(2L)
                    .taskCode("MNT-0002")
                    .status(MaintenanceStatus.SCHEDULED)
                    .build();
            when(taskRepository.findByHospitalId(hospital.getId()))
                    .thenReturn(List.of(task, undated));

            String ical = maintenanceService.exportTasksToICal(authentication);

            assertEquals(1, ical.lines().filter("BEGIN:VEVENT"::equals).count());
            assertTrue(ical.contains("MNT-0001@medtrack.com"));
        }
    }
}
