package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.util.DisposalCertificatePdf;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests verifying user identifier resolution (username vs email fallback)
 * across domain services.
 */
@ExtendWith(MockitoExtension.class)
class UserResolutionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    @Mock
    private FacilityLocationRepository facilityLocationRepository;

    @Mock
    private EquipmentDisposalRepository disposalRepository;

    @Mock
    private EquipmentLifecycleActionRepository lifecycleRepository;

    @Mock
    private DisposalCertificatePdf certificatePdf;

    private User sampleUser;
    private Hospital sampleHospital;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(42L)
                .name("Admin User")
                .username("admin")
                .email("hospital@medtrack.com")
                .role("hospital")
                .phone("+15550192834")
                .organization("City General Hospital")
                .build();

        sampleHospital = Hospital.builder()
                .id(100L)
                .name("City General Hospital")
                .user(sampleUser)
                .build();
    }

    @Nested
    @DisplayName("EquipmentService User Resolution")
    class EquipmentServiceTests {

        @Test
        @DisplayName("Resolves hospital by exact username when matching")
        void resolvesByUsername() {
            EquipmentService service = new EquipmentService(
                    equipmentRepository,
                    hospitalRepository,
                    userRepository,
                    null,
                    facilityLocationRepository,
                    null
            );

            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(equipmentRepository.findByHospitalId(100L)).thenReturn(Collections.emptyList());

            var result = service.getAllEquipment("admin");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByUsername("admin");
            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("Falls back to email lookup when username lookup returns empty")
        void resolvesByEmailFallback() {
            EquipmentService service = new EquipmentService(
                    equipmentRepository,
                    hospitalRepository,
                    userRepository,
                    null,
                    facilityLocationRepository,
                    null
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(equipmentRepository.findByHospitalId(100L)).thenReturn(Collections.emptyList());

            var result = service.getAllEquipment("hospital@medtrack.com");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByUsername("hospital@medtrack.com");
            verify(userRepository).findByEmail("hospital@medtrack.com");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when user is not found by username or email")
        void throwsWhenUserNotFound() {
            EquipmentService service = new EquipmentService(
                    equipmentRepository,
                    hospitalRepository,
                    userRepository,
                    null,
                    facilityLocationRepository,
                    null
            );

            when(userRepository.findByUsername("unknown@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("unknown@medtrack.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getAllEquipment("unknown@medtrack.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("SparePartService User Resolution")
    class SparePartServiceTests {

        @Test
        @DisplayName("Resolves hospital by email fallback for spare parts listing")
        void resolvesByEmailFallbackForSpareParts() {
            SparePartService service = new SparePartService(
                    sparePartRepository,
                    hospitalRepository,
                    userRepository
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(sparePartRepository.findByHospitalId(100L)).thenReturn(Collections.emptyList());

            var result = service.getAllSpareParts("hospital@medtrack.com");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByEmail("hospital@medtrack.com");
        }

        @Test
        @DisplayName("Rejects null or blank identifier for spare parts operations")
        void rejectsBlankIdentifier() {
            SparePartService service = new SparePartService(
                    sparePartRepository,
                    hospitalRepository,
                    userRepository
            );

            assertThatThrownBy(() -> service.getAllSpareParts("   "))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Username is required");
        }
    }

    @Nested
    @DisplayName("LocationService User Resolution")
    class LocationServiceTests {

        @Test
        @DisplayName("Resolves hospital by email fallback for location tree queries")
        void resolvesByEmailFallbackForLocations() {
            LocationService service = new LocationService(
                    facilityLocationRepository,
                    null,
                    equipmentRepository,
                    hospitalRepository,
                    userRepository
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(facilityLocationRepository.findByHospitalId(100L)).thenReturn(Collections.emptyList());

            var result = service.getLocationTree("hospital@medtrack.com");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByEmail("hospital@medtrack.com");
        }
    }

    @Nested
    @DisplayName("EquipmentDisposalService User Resolution")
    class DisposalServiceTests {

        @Test
        @DisplayName("Resolves hospital by email fallback for pending disposal requests")
        void resolvesByEmailFallbackForDisposals() {
            EquipmentDisposalService service = new EquipmentDisposalService(
                    disposalRepository,
                    lifecycleRepository,
                    equipmentRepository,
                    hospitalRepository,
                    userRepository,
                    certificatePdf
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(disposalRepository.findByHospitalIdAndStatusOrderByRequestedAtDesc(eq(100L), any()))
                    .thenReturn(Collections.emptyList());

            var result = service.getPendingDisposals("hospital@medtrack.com");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByEmail("hospital@medtrack.com");
        }
    }

    @Nested
    @DisplayName("DuplicateDetectionService User Resolution")
    class DuplicateDetectionTests {

        @Test
        @DisplayName("Resolves hospital by email fallback for duplicate detection scans")
        void resolvesByEmailFallbackForDuplicateDetection() {
            DuplicateDetectionService service = new DuplicateDetectionService(
                    equipmentRepository,
                    hospitalRepository,
                    userRepository,
                    null
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(equipmentRepository.findByHospitalId(100L)).thenReturn(Collections.emptyList());

            var result = service.findDuplicateGroups("hospital@medtrack.com");

            assertThat(result).isNotNull().isEmpty();
            verify(userRepository).findByEmail("hospital@medtrack.com");
        }
    }

    @Nested
    @DisplayName("EquipmentLifecycleService User Resolution")
    class LifecycleServiceTests {

        @Test
        @DisplayName("Resolves hospital by email fallback for equipment lifecycle history")
        void resolvesByEmailFallbackForLifecycle() {
            EquipmentLifecycleService service = new EquipmentLifecycleService(
                    lifecycleRepository,
                    equipmentRepository,
                    hospitalRepository,
                    userRepository
            );

            when(userRepository.findByUsername("hospital@medtrack.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("hospital@medtrack.com")).thenReturn(Optional.of(sampleUser));
            when(hospitalRepository.findByUserId(42L)).thenReturn(Optional.of(sampleHospital));
            when(equipmentRepository.findByIdAndHospitalId(1L, 100L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getTimeline(1L, "hospital@medtrack.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Equipment not found");

            verify(userRepository).findByEmail("hospital@medtrack.com");
        }
    }
}
