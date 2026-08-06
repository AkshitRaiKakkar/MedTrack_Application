package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.StockAdjustmentRequest;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
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

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceLocationTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @Mock
    private FacilityLocationRepository facilityLocationRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    @InjectMocks
    private EquipmentService equipmentService;

    private User mockUser;
    private Hospital mockHospital;
    private FacilityLocation buildingLocation;
    private FacilityLocation floorLocation;
    private FacilityLocation roomLocation;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .username("hospital_admin")
                .email("admin@generalhospital.org")
                .build();

        mockHospital = Hospital.builder()
                .id(10L)
                .name("General Hospital")
                .user(mockUser)
                .build();

        buildingLocation = FacilityLocation.builder()
                .id(100L)
                .name("Building A")
                .hospital(mockHospital)
                .parentId(null)
                .build();

        floorLocation = FacilityLocation.builder()
                .id(101L)
                .name("Floor 2")
                .hospital(mockHospital)
                .parentId(100L)
                .build();

        roomLocation = FacilityLocation.builder()
                .id(102L)
                .name("ICU Room 204")
                .hospital(mockHospital)
                .parentId(101L)
                .build();
    }

    @Nested
    @DisplayName("Location Hierarchy Subtree Resolution Tests")
    class LocationHierarchyTests {

        @Test
        @DisplayName("Should fetch equipment filtering by location root and all descendant subtrees")
        void getAllEquipment_withValidLocationId_resolvesSubtreeAndQueriesRepository() {
            Pageable pageable = PageRequest.of(0, 10);
            Equipment assetInRoom = Equipment.builder()
                    .id(50L)
                    .equipmentCode("EQ-500")
                    .name("Ventilator X1")
                    .hospital(mockHospital)
                    .location(roomLocation)
                    .build();

            Page<Equipment> page = new PageImpl<>(List.of(assetInRoom), pageable, 1);
            List<FacilityLocation> locations = List.of(buildingLocation, floorLocation, roomLocation);

            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(mockHospital));
            when(facilityLocationRepository.findByHospitalId(10L)).thenReturn(locations);
            when(equipmentRepository.findByHospitalIdAndLocationIn(eq(10L), anySet(), eq(pageable)))
                    .thenReturn(page);

            Page<Equipment> result = equipmentService.getAllEquipment("hospital_admin", 100L, pageable);

            assertNotNull(result);
            assertEquals(1, result.getTotalElements());

            @SuppressWarnings("unchecked")
            ArgumentCaptor<Set<Long>> locationIdsCaptor = ArgumentCaptor.forClass(Set.class);
            verify(equipmentRepository).findByHospitalIdAndLocationIn(eq(10L), locationIdsCaptor.capture(), eq(pageable));

            Set<Long> queriedIds = locationIdsCaptor.getValue();
            assertTrue(queriedIds.contains(100L));
            assertTrue(queriedIds.contains(101L));
            assertTrue(queriedIds.contains(102L));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when locationId does not belong to user hospital")
        void getAllEquipment_withUnauthorizedLocationId_throwsResourceNotFoundException() {
            Pageable pageable = PageRequest.of(0, 10);
            List<FacilityLocation> locations = List.of(buildingLocation, floorLocation);

            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(mockHospital));
            when(facilityLocationRepository.findByHospitalId(10L)).thenReturn(locations);

            ResourceNotFoundException exception = assertThrows(
                    ResourceNotFoundException.class,
                    () -> equipmentService.getAllEquipment("hospital_admin", 999L, pageable)
            );

            assertTrue(exception.getMessage().contains("Facility location not found with ID: 999"));
            verifyNoInteractions(equipmentRepository);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user is not found")
        void getAllEquipment_withUnknownUser_throwsResourceNotFoundException() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

            assertThrows(
                    ResourceNotFoundException.class,
                    () -> equipmentService.getAllEquipment("unknown_user", null, pageable)
            );
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when hospital profile is missing")
        void getAllEquipment_withMissingHospital_throwsResourceNotFoundException() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.empty());

            assertThrows(
                    ResourceNotFoundException.class,
                    () -> equipmentService.getAllEquipment("hospital_admin", null, pageable)
            );
        }
    }

    @Nested
    @DisplayName("Low Stock Event Publishing Tests")
    class LowStockEventPublishingTests {

        @Test
        @DisplayName("Should publish CRITICAL low stock event when quantity reaches zero")
        void checkAndPublishLowStockAlert_whenQuantityIsZero_publishesCriticalEvent() {
            Equipment outOfStockAsset = Equipment.builder()
                    .id(60L)
                    .equipmentCode("EQ-600")
                    .name("Defibrillator Pro")
                    .quantity(15)
                    .minimumStock(5)
                    .hospital(mockHospital)
                    .build();

            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(mockHospital));
            when(equipmentRepository.findByIdAndHospitalId(60L, 10L)).thenReturn(Optional.of(outOfStockAsset));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StockAdjustmentRequest adjustmentRequest = StockAdjustmentRequest.builder()
                    .delta(-15)
                    .reason("Inventory depleted")
                    .build();

            equipmentService.adjustStock(60L, adjustmentRequest, "hospital_admin");

            verify(eventPublisherService).publishEvent(
                    eq(10L),
                    eq(OperationsEvent.EventCategory.EQUIPMENT),
                    eq(OperationsEvent.EventType.EQUIPMENT_LOW_STOCK),
                    contains("Out of stock"),
                    contains("EQ-600"),
                    eq(60L),
                    eq(OperationsEvent.EntityType.EQUIPMENT),
                    eq("system"),
                    eq(OperationsEvent.EventSeverity.CRITICAL)
            );
        }

        @Test
        @DisplayName("Should publish WARNING low stock event when quantity is below minimum stock")
        void checkAndPublishLowStockAlert_whenQuantityBelowMinimum_publishesWarningEvent() {
            Equipment lowStockAsset = Equipment.builder()
                    .id(61L)
                    .equipmentCode("EQ-601")
                    .name("ECG Monitor")
                    .quantity(15)
                    .minimumStock(10)
                    .hospital(mockHospital)
                    .build();

            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(mockHospital));
            when(equipmentRepository.findByIdAndHospitalId(61L, 10L)).thenReturn(Optional.of(lowStockAsset));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StockAdjustmentRequest adjustmentRequest = StockAdjustmentRequest.builder()
                    .delta(-7)
                    .reason("Used in emergency ward")
                    .build();

            equipmentService.adjustStock(61L, adjustmentRequest, "hospital_admin");

            verify(eventPublisherService).publishEvent(
                    eq(10L),
                    eq(OperationsEvent.EventCategory.EQUIPMENT),
                    eq(OperationsEvent.EventType.EQUIPMENT_LOW_STOCK),
                    contains("Low stock"),
                    contains("EQ-601"),
                    eq(61L),
                    eq(OperationsEvent.EntityType.EQUIPMENT),
                    eq("system"),
                    eq(OperationsEvent.EventSeverity.WARNING)
            );
        }

        @Test
        @DisplayName("Should not publish low stock event when stock level remains above threshold")
        void checkAndPublishLowStockAlert_whenStockIsSufficient_doesNotPublishEvent() {
            Equipment normalStockAsset = Equipment.builder()
                    .id(62L)
                    .equipmentCode("EQ-602")
                    .name("Surgical Scissors")
                    .quantity(20)
                    .minimumStock(10)
                    .hospital(mockHospital)
                    .build();

            when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(mockUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(mockHospital));
            when(equipmentRepository.findByIdAndHospitalId(62L, 10L)).thenReturn(Optional.of(normalStockAsset));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StockAdjustmentRequest adjustmentRequest = StockAdjustmentRequest.builder()
                    .delta(5)
                    .reason("Restocked")
                    .build();

            equipmentService.adjustStock(62L, adjustmentRequest, "hospital_admin");

            verifyNoInteractions(eventPublisherService);
        }
    }
}
