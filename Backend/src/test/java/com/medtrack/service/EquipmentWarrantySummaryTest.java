package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.WarrantySummaryResponse;
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

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers {@link EquipmentService#getWarrantySummary(String)}.
 *
 * <p>Three regressions are pinned here: null-warranty equipment must not be reported as covered, the
 * buckets must partition the inventory, and the counts must come from {@code COUNT(*)} rather than
 * from materialised entity lists.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EquipmentService warranty summary")
class EquipmentWarrantySummaryTest {

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

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).username(USERNAME).build();
        Hospital hospital = Hospital.builder().id(HOSPITAL_ID).name("City General").user(user).build();
        lenient().when(userRepository.findByUsername(USERNAME)).thenReturn(java.util.Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(1L)).thenReturn(java.util.Optional.of(hospital));
    }

    /** Stubs the five counting queries the method issues. */
    private void givenCounts(long total, long expired, long expiringSoon, long valid, long unknown) {
        when(equipmentRepository.countByHospitalId(HOSPITAL_ID)).thenReturn(total);
        when(equipmentRepository.countByHospitalIdAndWarrantyExpiryBefore(eq(HOSPITAL_ID), any()))
                .thenReturn(expired);
        when(equipmentRepository.countByHospitalIdAndWarrantyExpiryBetween(eq(HOSPITAL_ID), any(), any()))
                .thenReturn(expiringSoon);
        when(equipmentRepository.countByHospitalIdAndWarrantyExpiryAfter(eq(HOSPITAL_ID), any()))
                .thenReturn(valid);
        when(equipmentRepository.countByHospitalIdAndWarrantyExpiryIsNull(HOSPITAL_ID))
                .thenReturn(unknown);
    }

    // -----------------------------------------------------------------
    // the null-warranty regression
    // -----------------------------------------------------------------

    @Test
    @DisplayName("equipment with no warranty date is reported as unknown, not as valid")
    void nullWarrantyIsNotCountedAsValid() {
        // Both seeded demo assets have no warrantyExpiry, and nothing in AddEquipmentForm requires
        // one. Previously `valid = total - expired` reported them as covered.
        givenCounts(2, 0, 0, 0, 2);

        WarrantySummaryResponse summary = equipmentService.getWarrantySummary(USERNAME);

        assertEquals(2, summary.getTotal());
        assertEquals(2, summary.getUnknown(), "both assets have no warranty on record");
        assertEquals(0, summary.getValid(),
                "an asset with no warranty date must not be reported as having a valid warranty");
        assertEquals(0, summary.getExpired());
        assertEquals(0, summary.getExpiringSoon());
    }

    // -----------------------------------------------------------------
    // the partition property
    // -----------------------------------------------------------------

    @Test
    @DisplayName("the buckets sum to total")
    void bucketsPartitionTheInventory() {
        // One expired, one expiring in 10 days, one expiring in 3 years, one with no date.
        givenCounts(4, 1, 1, 1, 1);

        WarrantySummaryResponse summary = equipmentService.getWarrantySummary(USERNAME);

        assertEquals(summary.getTotal(),
                summary.getExpired() + summary.getExpiringSoon() + summary.getValid()
                        + summary.getUnknown(),
                "expired + expiringSoon + valid + unknown must equal total; previously expiringSoon "
                        + "was a subset of valid while being returned as a peer, so the buckets "
                        + "summed to more than the total");
    }

    @Test
    @DisplayName("expiringSoon is no longer double-counted in valid")
    void expiringSoonIsNotAlsoValid() {
        // The scenario from the report: 3 assets, one of each. The old code returned
        // expired=1, expiringSoon=1, valid=2 -> sums to 4 for a total of 3.
        givenCounts(3, 1, 1, 1, 0);

        WarrantySummaryResponse summary = equipmentService.getWarrantySummary(USERNAME);

        assertEquals(1, summary.getValid(),
                "valid must mean 'expires beyond the horizon', excluding the expiring-soon asset");
        assertEquals(3, summary.getExpired() + summary.getExpiringSoon() + summary.getValid());
    }

    @Test
    @DisplayName("an empty inventory reports all zeroes")
    void emptyInventory() {
        givenCounts(0, 0, 0, 0, 0);

        WarrantySummaryResponse summary = equipmentService.getWarrantySummary(USERNAME);

        assertEquals(0, summary.getTotal());
        assertEquals(0, summary.getExpired());
        assertEquals(0, summary.getExpiringSoon());
        assertEquals(0, summary.getValid());
        assertEquals(0, summary.getUnknown());
    }

    // -----------------------------------------------------------------
    // query shape
    // -----------------------------------------------------------------

    @Test
    @DisplayName("counts come from COUNT queries, never from loading entity lists")
    void doesNotMaterialiseEntityLists() {
        givenCounts(4, 1, 1, 1, 1);

        equipmentService.getWarrantySummary(USERNAME);

        // The previous implementation called all three of these purely to invoke size() on the
        // result, hydrating every matching row into the persistence context to count it.
        verify(equipmentRepository, never()).findByHospitalId(anyLong());
        verify(equipmentRepository, never())
                .findByHospitalIdAndWarrantyExpiryBefore(anyLong(), any());
        verify(equipmentRepository, never())
                .findByHospitalIdAndWarrantyExpiryBetween(anyLong(), any(), any());

        verify(equipmentRepository).countByHospitalId(HOSPITAL_ID);
        verify(equipmentRepository).countByHospitalIdAndWarrantyExpiryIsNull(HOSPITAL_ID);
    }

    @Test
    @DisplayName("the horizon is exactly 30 days after a single evaluation of today")
    void horizonIsConsistent() {
        givenCounts(1, 0, 0, 1, 0);

        equipmentService.getWarrantySummary(USERNAME);

        ArgumentCaptor<LocalDate> betweenStart = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> betweenEnd = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository).countByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), betweenStart.capture(), betweenEnd.capture());

        ArgumentCaptor<LocalDate> expiredBefore = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository)
                .countByHospitalIdAndWarrantyExpiryBefore(eq(HOSPITAL_ID), expiredBefore.capture());

        ArgumentCaptor<LocalDate> validAfter = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository)
                .countByHospitalIdAndWarrantyExpiryAfter(eq(HOSPITAL_ID), validAfter.capture());

        LocalDate today = betweenStart.getValue();

        // Every query must be anchored to the same "today". Four separate LocalDate.now() calls
        // could straddle midnight and put one asset in two buckets, or in none.
        assertEquals(today, expiredBefore.getValue(),
                "the expired boundary must use the same 'today' as the expiring-soon window");
        assertEquals(today.plusDays(EquipmentService.WARRANTY_EXPIRY_HORIZON_DAYS),
                betweenEnd.getValue());
        assertEquals(betweenEnd.getValue(), validAfter.getValue(),
                "valid must start exactly where expiringSoon ends, or assets fall between the two");
    }

    @Test
    @DisplayName("boundaries do not overlap: the horizon day belongs to expiringSoon only")
    void horizonBoundaryIsNotShared() {
        givenCounts(1, 0, 1, 0, 0);

        equipmentService.getWarrantySummary(USERNAME);

        ArgumentCaptor<LocalDate> betweenEnd = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository).countByHospitalIdAndWarrantyExpiryBetween(
                eq(HOSPITAL_ID), any(), betweenEnd.capture());
        ArgumentCaptor<LocalDate> validAfter = ArgumentCaptor.forClass(LocalDate.class);
        verify(equipmentRepository)
                .countByHospitalIdAndWarrantyExpiryAfter(eq(HOSPITAL_ID), validAfter.capture());

        // BETWEEN is inclusive of its upper bound and After is strict, so an asset expiring exactly
        // on the horizon is counted once, by expiringSoon.
        assertEquals(betweenEnd.getValue(), validAfter.getValue());
    }

    @Test
    @DisplayName("results are scoped to the caller's hospital")
    void scopedToCallersHospital() {
        givenCounts(1, 0, 0, 1, 0);

        equipmentService.getWarrantySummary(USERNAME);

        for (Long id : List.of(HOSPITAL_ID)) {
            verify(equipmentRepository).countByHospitalId(id);
            verify(equipmentRepository).countByHospitalIdAndWarrantyExpiryIsNull(id);
        }
    }
}
