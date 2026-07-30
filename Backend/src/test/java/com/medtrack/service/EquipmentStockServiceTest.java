package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.LowStockSummaryResponse;
import com.medtrack.dto.StockAdjustmentRequest;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers the stock-level behaviour added to {@link EquipmentService}: the signed-delta adjustment
 * path, its bounds, tenant scoping, and the low-stock aggregate.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EquipmentService stock levels")
class EquipmentStockServiceTest {

    private static final String USERNAME = "hospital_admin";
    private static final Long HOSPITAL_ID = 10L;
    private static final Long EQUIPMENT_ID = 100L;

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
        User user = User.builder()
                .id(1L)
                .username(USERNAME)
                .email("hospital@medtrack.com")
                .build();

        hospital = Hospital.builder()
                .id(HOSPITAL_ID)
                .name("General Hospital")
                .user(user)
                .build();
    }

    private void givenAuthenticatedHospital() {
        User user = User.builder().id(1L).username(USERNAME).build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(hospital));
    }

    private Equipment equipmentWithStock(int quantity, int minimumStock) {
        return Equipment.builder()
                .id(EQUIPMENT_ID)
                .name("Surgical Gloves")
                .department("Theatre")
                .category(EquipmentCategory.SURGICAL)
                .quantity(quantity)
                .minimumStock(minimumStock)
                .hospital(hospital)
                .build();
    }

    // -----------------------------------------------------------------
    // adjustStock
    // -----------------------------------------------------------------

    @Nested
    @DisplayName("adjustStock")
    class AdjustStock {

        @Test
        @DisplayName("adds units for a positive delta")
        void addsUnitsForPositiveDelta() {
            givenAuthenticatedHospital();
            Equipment equipment = equipmentWithStock(12, 10);
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

            Equipment result = equipmentService.adjustStock(
                    EQUIPMENT_ID,
                    StockAdjustmentRequest.builder().delta(8).reason("Delivery GRN-4471").build(),
                    USERNAME);

            assertEquals(20, result.getQuantity());
            assertEquals(10, result.getMinimumStock(), "threshold must be untouched");
        }

        @Test
        @DisplayName("removes units for a negative delta")
        void removesUnitsForNegativeDelta() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipmentWithStock(12, 10)));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

            Equipment result = equipmentService.adjustStock(
                    EQUIPMENT_ID,
                    StockAdjustmentRequest.builder().delta(-5).build(),
                    USERNAME);

            assertEquals(7, result.getQuantity());
        }

        @Test
        @DisplayName("allows a delta that lands exactly on zero")
        void allowsExactlyZero() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipmentWithStock(4, 10)));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

            Equipment result = equipmentService.adjustStock(
                    EQUIPMENT_ID,
                    StockAdjustmentRequest.builder().delta(-4).build(),
                    USERNAME);

            assertEquals(0, result.getQuantity(), "zero stock is a legitimate state");
        }

        @Test
        @DisplayName("rejects a delta that would drive quantity negative, without saving")
        void rejectsNegativeResult() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipmentWithStock(3, 10)));

            IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().delta(-4).build(),
                            USERNAME));

            assertTrue(error.getMessage().contains("Insufficient stock"), error.getMessage());
            verify(equipmentRepository, never()).save(any(Equipment.class));
        }

        @Test
        @DisplayName("rejects a zero delta as a probable client bug")
        void rejectsZeroDelta() {
            IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().delta(0).build(),
                            USERNAME));

            assertEquals("Stock delta must not be zero", error.getMessage());
            verify(equipmentRepository, never()).save(any(Equipment.class));
        }

        @Test
        @DisplayName("rejects a missing delta")
        void rejectsMissingDelta() {
            assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().build(),
                            USERNAME));

            assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(EQUIPMENT_ID, null, USERNAME));
        }

        @Test
        @DisplayName("rejects an adjustment that would overflow the column")
        void rejectsOverflow() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipmentWithStock(10, 5)));

            IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().delta(Integer.MAX_VALUE).build(),
                            USERNAME));

            assertTrue(error.getMessage().contains("exceeds the supported maximum"), error.getMessage());
            verify(equipmentRepository, never()).save(any(Equipment.class));
        }

        @Test
        @DisplayName("updates the reorder threshold when one is supplied")
        void updatesThresholdWhenSupplied() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(equipmentWithStock(12, 10)));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

            Equipment result = equipmentService.adjustStock(
                    EQUIPMENT_ID,
                    StockAdjustmentRequest.builder().delta(1).minimumStock(25).build(),
                    USERNAME);

            assertEquals(13, result.getQuantity());
            assertEquals(25, result.getMinimumStock());
        }

        @Test
        @DisplayName("rejects a negative reorder threshold")
        void rejectsNegativeThreshold() {
            assertThrows(IllegalArgumentException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().delta(1).minimumStock(-1).build(),
                            USERNAME));
        }

        @Test
        @DisplayName("treats a legacy null quantity as zero rather than failing")
        void treatsNullQuantityAsZero() {
            givenAuthenticatedHospital();
            Equipment legacy = Equipment.builder()
                    .id(EQUIPMENT_ID)
                    .name("Pre-migration asset")
                    .department("Store")
                    .quantity(null)
                    .minimumStock(null)
                    .hospital(hospital)
                    .build();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(legacy));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

            Equipment result = equipmentService.adjustStock(
                    EQUIPMENT_ID,
                    StockAdjustmentRequest.builder().delta(6).build(),
                    USERNAME);

            assertEquals(6, result.getQuantity());
        }

        @Test
        @DisplayName("cannot touch equipment belonging to another hospital")
        void cannotTouchAnotherHospitalsEquipment() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () ->
                    equipmentService.adjustStock(
                            EQUIPMENT_ID,
                            StockAdjustmentRequest.builder().delta(1).build(),
                            USERNAME));

            verify(equipmentRepository, never()).save(any(Equipment.class));
        }
    }

    // -----------------------------------------------------------------
    // getLowStockSummary
    // -----------------------------------------------------------------

    @Nested
    @DisplayName("getLowStockSummary")
    class LowStockSummary {

        @Test
        @DisplayName("counts low, out-of-stock and total units")
        void countsAcrossInventory() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of(
                    equipmentWithStock(50, 10),  // healthy
                    equipmentWithStock(10, 10),  // at threshold -> low
                    equipmentWithStock(3, 10),   // below threshold -> low
                    equipmentWithStock(0, 5)     // low and out of stock
            ));

            LowStockSummaryResponse summary = equipmentService.getLowStockSummary(USERNAME);

            assertEquals(4, summary.getTotalTrackedItems());
            assertEquals(3, summary.getLowStockItems(), "at-threshold counts as low");
            assertEquals(1, summary.getOutOfStockItems());
            assertEquals(63, summary.getTotalUnitsInStock());
        }

        @Test
        @DisplayName("returns zeroes for an empty inventory")
        void handlesEmptyInventory() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByHospitalId(HOSPITAL_ID)).thenReturn(List.of());

            LowStockSummaryResponse summary = equipmentService.getLowStockSummary(USERNAME);

            assertEquals(0, summary.getTotalTrackedItems());
            assertEquals(0, summary.getLowStockItems());
            assertEquals(0, summary.getOutOfStockItems());
            assertEquals(0, summary.getTotalUnitsInStock());
        }

        @Test
        @DisplayName("counts an out-of-stock item once, not twice")
        void outOfStockIsSubsetOfLowStock() {
            givenAuthenticatedHospital();
            when(equipmentRepository.findByHospitalId(HOSPITAL_ID))
                    .thenReturn(List.of(equipmentWithStock(0, 10)));

            LowStockSummaryResponse summary = equipmentService.getLowStockSummary(USERNAME);

            assertEquals(1, summary.getLowStockItems());
            assertEquals(1, summary.getOutOfStockItems());
        }
    }

    // -----------------------------------------------------------------
    // updateEquipment interaction
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a general update that omits stock leaves it intact")
    void generalUpdateDoesNotWipeStock() {
        givenAuthenticatedHospital();
        Equipment stored = equipmentWithStock(42, 15);
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                .thenReturn(Optional.of(stored));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

        // A PUT payload that renames the asset and says nothing about inventory.
        Equipment incoming = Equipment.builder()
                .name("Surgical Gloves (Large)")
                .department("Theatre")
                .quantity(null)
                .minimumStock(null)
                .build();

        Equipment result = equipmentService.updateEquipment(EQUIPMENT_ID, incoming, USERNAME);

        assertEquals("Surgical Gloves (Large)", result.getName());
        assertEquals(42, result.getQuantity(), "omitted quantity must not be zeroed");
        assertEquals(15, result.getMinimumStock(), "omitted threshold must not be zeroed");
    }

    @Test
    @DisplayName("a general update that supplies stock still applies it")
    void generalUpdateAppliesSuppliedStock() {
        givenAuthenticatedHospital();
        when(equipmentRepository.findByIdAndHospitalId(EQUIPMENT_ID, HOSPITAL_ID))
                .thenReturn(Optional.of(equipmentWithStock(42, 15)));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(call -> call.getArgument(0));

        Equipment incoming = Equipment.builder()
                .name("Surgical Gloves")
                .department("Theatre")
                .quantity(7)
                .minimumStock(3)
                .build();

        Equipment result = equipmentService.updateEquipment(EQUIPMENT_ID, incoming, USERNAME);

        assertEquals(7, result.getQuantity());
        assertEquals(3, result.getMinimumStock());
    }

    @Test
    @DisplayName("a newly built Equipment defaults to 0 / 10")
    void builderDefaults() {
        Equipment fresh = Equipment.builder().name("New asset").department("Store").build();

        assertEquals(0, fresh.getQuantity());
        assertEquals(10, fresh.getMinimumStock(),
                "must match the default EquipmentService.addEquipment already assumed");
    }
}
