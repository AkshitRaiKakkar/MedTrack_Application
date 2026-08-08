package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.SparePartDeductRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.SparePart;
import com.medtrack.service.SparePartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SparePartControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SparePartService sparePartService;

    @InjectMocks
    private SparePartController sparePartController;

    private ObjectMapper objectMapper;
    private Authentication hospitalAuth;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sparePartController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        hospitalAuth = new UsernamePasswordAuthenticationToken(
                "hospitalUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL"))
        );
    }

    @Test
    @DisplayName("Should return list of spare parts for authenticated hospital")
    void shouldReturnAllSpareParts() throws Exception {
        SparePart part = new SparePart();
        part.setId(1L);
        part.setPartNumber("SP-100");
        part.setDescription("Filter Valve");
        part.setStockLevel(10);

        when(sparePartService.getAllSpareParts("hospitalUser")).thenReturn(List.of(part));

        mockMvc.perform(get("/api/spare-parts")
                        .principal(hospitalAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].partNumber").value("SP-100"))
                .andExpect(jsonPath("$[0].stockLevel").value(10));

        verify(sparePartService).getAllSpareParts("hospitalUser");
    }

    @Test
    @DisplayName("Should return low stock spare parts alerts")
    void shouldReturnLowStockAlerts() throws Exception {
        SparePart lowStockPart = new SparePart();
        lowStockPart.setId(2L);
        lowStockPart.setPartNumber("SP-200");
        lowStockPart.setStockLevel(2);
        lowStockPart.setReorderPoint(5);

        when(sparePartService.getLowStockAlerts("hospitalUser")).thenReturn(List.of(lowStockPart));

        mockMvc.perform(get("/api/spare-parts/low-stock")
                        .principal(hospitalAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].partNumber").value("SP-200"))
                .andExpect(jsonPath("$[0].stockLevel").value(2));

        verify(sparePartService).getLowStockAlerts("hospitalUser");
    }

    @Test
    @DisplayName("Should create new spare part when request is valid")
    void shouldCreateSparePart() throws Exception {
        SparePart newPart = new SparePart();
        newPart.setPartNumber("SP-300");
        newPart.setDescription("Sensor Probe");
        newPart.setStockLevel(10);
        newPart.setReorderPoint(5);
        newPart.setUnitCost(150.0);

        SparePart createdPart = new SparePart();
        createdPart.setId(3L);
        createdPart.setPartNumber("SP-300");
        createdPart.setDescription("Sensor Probe");
        createdPart.setStockLevel(10);
        createdPart.setReorderPoint(5);
        createdPart.setUnitCost(150.0);

        when(sparePartService.createSparePart(any(SparePart.class), eq("hospitalUser")))
                .thenReturn(createdPart);

        mockMvc.perform(post("/api/spare-parts")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newPart)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.partNumber").value("SP-300"));

        verify(sparePartService).createSparePart(any(SparePart.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should update existing spare part")
    void shouldUpdateSparePart() throws Exception {
        SparePart updatePart = new SparePart();
        updatePart.setPartNumber("SP-100-REV");
        updatePart.setDescription("Updated Filter Valve");
        updatePart.setStockLevel(15);
        updatePart.setReorderPoint(5);
        updatePart.setUnitCost(200.0);

        when(sparePartService.updateSparePart(eq(1L), any(SparePart.class), eq("hospitalUser")))
                .thenReturn(updatePart);

        mockMvc.perform(put("/api/spare-parts/1")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePart)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partNumber").value("SP-100-REV"));

        verify(sparePartService).updateSparePart(eq(1L), any(SparePart.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("Should delete spare part successfully")
    void shouldDeleteSparePart() throws Exception {
        doNothing().when(sparePartService).deleteSparePart(1L, "hospitalUser");

        mockMvc.perform(delete("/api/spare-parts/1")
                        .principal(hospitalAuth))
                .andExpect(status().isNoContent());

        verify(sparePartService).deleteSparePart(1L, "hospitalUser");
    }

    @Test
    @DisplayName("Should deduct stock when request is valid")
    void shouldDeductStockSuccessfully() throws Exception {
        SparePartDeductRequest request = SparePartDeductRequest.builder()
                .partNumber("SP-100")
                .quantity(3)
                .build();

        doNothing().when(sparePartService).deductStock("SP-100", 3, "hospitalUser");

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(sparePartService).deductStock("SP-100", 3, "hospitalUser");
    }

    @Test
    @DisplayName("Should return 400 Bad Request when deduct request validation fails")
    void shouldFailValidationOnInvalidDeductRequest() throws Exception {
        SparePartDeductRequest invalidRequest = SparePartDeductRequest.builder()
                .partNumber("")
                .quantity(0)
                .build();

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when stock deduction fails due to insufficient stock")
    void shouldReturnBadRequestWhenInsufficientStock() throws Exception {
        SparePartDeductRequest request = SparePartDeductRequest.builder()
                .partNumber("SP-100")
                .quantity(100)
                .build();

        doThrow(new IllegalArgumentException("Insufficient stock for part: SP-100"))
                .when(sparePartService).deductStock("SP-100", 100, "hospitalUser");

        mockMvc.perform(post("/api/spare-parts/deduct")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should restock stock when request is valid")
    void shouldRestockStockSuccessfully() throws Exception {
        SparePartDeductRequest request = SparePartDeductRequest.builder()
                .partNumber("SP-100")
                .quantity(5)
                .build();

        doNothing().when(sparePartService).restockStock("SP-100", 5, "hospitalUser");

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(sparePartService).restockStock("SP-100", 5, "hospitalUser");
    }

    @Test
    @DisplayName("Should return 400 Bad Request when restock quantity is invalid")
    void shouldFailValidationOnInvalidRestockRequest() throws Exception {
        SparePartDeductRequest invalidRequest = SparePartDeductRequest.builder()
                .partNumber("SP-100")
                .quantity(-2)
                .build();

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 404 Not Found when restocking non-existent part")
    void shouldReturnNotFoundWhenRestockingNonExistentPart() throws Exception {
        SparePartDeductRequest request = SparePartDeductRequest.builder()
                .partNumber("NON-EXISTENT")
                .quantity(5)
                .build();

        doThrow(new ResourceNotFoundException("Spare part not found: NON-EXISTENT"))
                .when(sparePartService).restockStock("NON-EXISTENT", 5, "hospitalUser");

        mockMvc.perform(post("/api/spare-parts/restock")
                        .principal(hospitalAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
