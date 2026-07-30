package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Service-level behaviour for {@code /api/equipment/search} and {@code /api/equipment/filter}:
 * input validation, tenant resolution, and result ordering.
 *
 * <p>The predicates themselves are verified against a real database in
 * {@code EquipmentSpecificationsTest}; asserting on them through a mocked repository would only
 * assert that a lambda was constructed.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EquipmentService search and filter")
class EquipmentSearchServiceTest {

    private static final String USERNAME = "hospital_admin";
    private static final Long HOSPITAL_ID = 10L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private Hospital hospital;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).username(USERNAME).build();
        hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").user(user).build();
    }

    private void givenAuthenticatedHospital() {
        User user = User.builder().id(1L).username(USERNAME).build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    // -----------------------------------------------------------------
    // searchEquipment
    // -----------------------------------------------------------------

    @Test
    @DisplayName("rejects a blank keyword instead of returning the whole inventory")
    void rejectsBlankKeyword() {
        for (String blank : new String[] {null, "", "   ", "\t"}) {
            IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                    () -> equipmentService.searchEquipment(blank, USERNAME),
                    "keyword <" + blank + "> should have been rejected");
            assertEquals("Search keyword must not be blank", error.getMessage());
        }

        verify(equipmentRepository, never()).findAll(any(Specification.class), any(Sort.class));
    }

    @Test
    @DisplayName("scopes the search to the caller's hospital and sorts by name")
    void searchesWithinCallersHospital() {
        givenAuthenticatedHospital();
        Equipment match = Equipment.builder().id(1L).name("MRI Scanner").hospital(hospital).build();
        when(equipmentRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(match));

        List<Equipment> results = equipmentService.searchEquipment("mri", USERNAME);

        assertEquals(List.of(match), results);

        ArgumentCaptor<Sort> sort = ArgumentCaptor.forClass(Sort.class);
        ArgumentCaptor<Specification<Equipment>> specification =
                ArgumentCaptor.forClass(Specification.class);
        verify(equipmentRepository).findAll(specification.capture(), sort.capture());

        assertNotNull(specification.getValue(), "a tenant-scoped specification must be supplied");
        assertEquals(Sort.by(Sort.Direction.ASC, "name"), sort.getValue());
    }

    @Test
    @DisplayName("propagates the not-found error when the caller has no hospital profile")
    void failsWhenCallerHasNoHospital() {
        User user = User.builder().id(1L).username(USERNAME).build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.searchEquipment("mri", USERNAME));

        verify(equipmentRepository, never()).findAll(any(Specification.class), any(Sort.class));
    }

    @Test
    @DisplayName("an unknown user cannot search")
    void unknownUserCannotSearch() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.searchEquipment("mri", USERNAME));
    }

    // -----------------------------------------------------------------
    // filterEquipment
    // -----------------------------------------------------------------

    @Test
    @DisplayName("accepts every filter combination, including none at all")
    void acceptsAnyFilterCombination() {
        givenAuthenticatedHospital();
        when(equipmentRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of());

        equipmentService.filterEquipment(USERNAME, null, null, null, null);
        equipmentService.filterEquipment(USERNAME, "ICU", null, null, null);
        equipmentService.filterEquipment(USERNAME, null, EquipmentCategory.IMAGING, null, null);
        equipmentService.filterEquipment(USERNAME, null, null, EquipmentStatus.RETIRED, null);
        equipmentService.filterEquipment(USERNAME, "ICU", EquipmentCategory.RESPIRATORY,
                EquipmentStatus.ACTIVE, "Philips");

        verify(equipmentRepository, org.mockito.Mockito.times(5))
                .findAll(any(Specification.class), any(Sort.class));
    }

    @Test
    @DisplayName("returns what the repository returns, sorted by name")
    void returnsRepositoryResults() {
        givenAuthenticatedHospital();
        Equipment first = Equipment.builder().id(1L).name("Analyser").hospital(hospital).build();
        Equipment second = Equipment.builder().id(2L).name("Ventilator").hospital(hospital).build();
        when(equipmentRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(first, second));

        List<Equipment> results =
                equipmentService.filterEquipment(USERNAME, "ICU", null, null, null);

        assertEquals(List.of(first, second), results);

        ArgumentCaptor<Sort> sort = ArgumentCaptor.forClass(Sort.class);
        verify(equipmentRepository).findAll(any(Specification.class), sort.capture());
        assertEquals(Sort.by(Sort.Direction.ASC, "name"), sort.getValue());
    }

    @Test
    @DisplayName("an unknown user cannot filter")
    void unknownUserCannotFilter() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.filterEquipment(USERNAME, "ICU", null, null, null));

        verify(equipmentRepository, never()).findAll(any(Specification.class), any(Sort.class));
    }
}
