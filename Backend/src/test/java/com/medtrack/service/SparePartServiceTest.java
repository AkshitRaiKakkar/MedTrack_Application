package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.*;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock private SparePartRepository sparePartRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private SparePartService sparePartService;

    private User user;
    private Hospital hospital;
    private SparePart sparePart;

    @BeforeEach
    void setUp() {
        user = User.builder().id(10L).username("hospital_admin").build();
        hospital = Hospital.builder().id(100L).user(user).name("City Hospital").build();
        sparePart = SparePart.builder().id(1L).hospitalId(100L).partNumber("SP-1001").description("Sensor").stockLevel(15).reorderPoint(5).unitCost(120.0).build();
    }

    @Test
    void createSparePart_success() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberIgnoreCase(100L, "SP-1001")).thenReturn(false);
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(i -> i.getArgument(0));
        SparePartCreateRequest req = SparePartCreateRequest.builder().partNumber("SP-1001").description("Sensor").stockLevel(15).reorderPoint(5).unitCost(120.0).build();
        assertThat(sparePartService.createSparePart(req, "hospital_admin").getPartNumber()).isEqualTo("SP-1001");
    }

    @Test
    void createSparePart_duplicate_throwsException() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberIgnoreCase(100L, "SP-1001")).thenReturn(true);
        SparePartCreateRequest req = SparePartCreateRequest.builder().partNumber("SP-1001").description("Sensor").stockLevel(10).reorderPoint(2).unitCost(50.0).build();
        assertThatThrownBy(() -> sparePartService.createSparePart(req, "hospital_admin")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deductStock_success() {
        when(userRepository.findByUsername("hospital_admin")).thenReturn(Optional.of(user));
        when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
        when(sparePartRepository.findByHospitalIdAndPartNumberForUpdate(100L, "SP-1001")).thenReturn(Optional.of(sparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(i -> i.getArgument(0));
        SparePartDeductRequest req = SparePartDeductRequest.builder().partNumber("SP-1001").quantity(5).build();
        assertThat(sparePartService.deductStock(req, "hospital_admin").getStockLevel()).isEqualTo(10);
    }

    @Test
    void deductStock_invalidQuantity_throwsException() {
        SparePartDeductRequest req = SparePartDeductRequest.builder().partNumber("SP-1001").quantity(-5).build();
        assertThatThrownBy(() -> sparePartService.deductStock(req, "hospital_admin")).isInstanceOf(IllegalArgumentException.class);
    }
}
