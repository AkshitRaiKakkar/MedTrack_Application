package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartStockRequest;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock private SparePartRepository sparePartRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private SparePartService sparePartService;

    private User testUser;
    private Hospital testHospital;
    private SparePart testSparePart;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(100L).username("hospitalAdmin").email("admin@hospital.com").role("HOSPITAL").build();
        testHospital = Hospital.builder().id(1L).name("General Hospital").user(testUser).build();
        testSparePart = SparePart.builder().id(50L).hospitalId(1L).partNumber("FILTER-001")
                .description("HEPA Air Filter").compatibleModels("Ventilator X1").stockLevel(25)
                .reorderPoint(10).unitCost(45.50).deleted(false).build();
    }

    @Test
    @DisplayName("createSparePart - successfully saves spare part when valid")
    void createSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(false);
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart created = sparePartService.createSparePart(testSparePart, "hospitalAdmin");
        assertThat(created).isNotNull();
        assertThat(created.getPartNumber()).isEqualTo("FILTER-001");
        verify(sparePartRepository).save(testSparePart);
    }

    @Test
    @DisplayName("createSparePart - throws exception when part number already exists")
    void createSparePart_DuplicatePartNumber_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(true);

        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part with part number already exists");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSparePart - throws exception when payload validation fails")
    void createSparePart_InvalidFields_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        testSparePart.setPartNumber("");
        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Part number is required");
    }

    @Test
    @DisplayName("updateSparePart - successfully updates spare part")
    void updateSparePart_Success() {
        SparePart updateRequest = SparePart.builder().partNumber("FILTER-001").description("Updated HEPA Filter")
                .compatibleModels("Ventilator X2").stockLevel(30).reorderPoint(15).unitCost(50.00).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalId(50L, 1L)).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart updated = sparePartService.updateSparePart(50L, updateRequest, "hospitalAdmin");
        assertThat(updated.getDescription()).isEqualTo("Updated HEPA Filter");
        assertThat(updated.getStockLevel()).isEqualTo(30);
    }

    @Test
    @DisplayName("deductStock - successfully deducts stock for active spare part")
    void deductStock_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(5).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart updated = sparePartService.deductStock(request, "hospitalAdmin");
        assertThat(updated.getStockLevel()).isEqualTo(20);
    }

    @Test
    @DisplayName("deductStock - throws exception when quantity is zero or negative")
    void deductStock_InvalidQuantity_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(-10).build();
        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Deduction quantity must be greater than zero");
    }

    @Test
    @DisplayName("deductStock - throws exception when stock is insufficient")
    void deductStock_InsufficientStock_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(100).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("restockSparePart - successfully increases stock level")
    void restockSparePart_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(15).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart restocked = sparePartService.restockSparePart(request, "hospitalAdmin");
        assertThat(restocked.getStockLevel()).isEqualTo(40);
    }

    @Test
    @DisplayName("getLowStockAlerts - delegates to repository for active low stock items")
    void getLowStockAlerts_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findLowStockPartsByHospitalId(1L)).thenReturn(List.of(testSparePart));

        List<SparePart> alerts = sparePartService.getLowStockAlerts("hospitalAdmin");
        assertThat(alerts).hasSize(1);
    }

    @Test
    @DisplayName("deleteSparePart - soft deletes the spare part record")
    void deleteSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalId(50L, 1L)).thenReturn(Optional.of(testSparePart));

        sparePartService.deleteSparePart(50L, "hospitalAdmin");

        ArgumentCaptor<SparePart> captor = ArgumentCaptor.forClass(SparePart.class);
        verify(sparePartRepository).save(captor.capture());
        assertThat(captor.getValue().getDeleted()).isTrue();
    }
}
