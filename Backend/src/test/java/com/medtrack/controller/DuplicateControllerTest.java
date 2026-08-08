package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.DuplicateGroupResponse;
import com.medtrack.dto.DuplicateMatch;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.service.DuplicateDetectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DuplicateControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DuplicateDetectionService duplicateDetectionService;

    @InjectMocks
    private DuplicateController duplicateController;

    private Principal hospitalPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(duplicateController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        hospitalPrincipal = new UsernamePasswordAuthenticationToken(
                "hospitalUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL"))
        );
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates - Should return list of duplicate groups")
    void shouldReturnDuplicateGroups() throws Exception {
        Equipment eq1 = new Equipment();
        eq1.setId(10L);
        eq1.setName("Patient Monitor X200");

        Equipment eq2 = new Equipment();
        eq2.setId(11L);
        eq2.setName("Patient Monitor X200 Typo");

        DuplicateGroupResponse group = DuplicateGroupResponse.builder()
                .matchedOn("SERIAL_NUMBER")
                .assets(List.of(eq1, eq2))
                .build();

        when(duplicateDetectionService.findDuplicateGroups("hospitalUser"))
                .thenReturn(List.of(group));

        mockMvc.perform(get("/api/equipment/duplicates")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].matchedOn").value("SERIAL_NUMBER"))
                .andExpect(jsonPath("$[0].assets[0].id").value(10))
                .andExpect(jsonPath("$[0].assets[1].id").value(11));

        verify(duplicateDetectionService).findDuplicateGroups("hospitalUser");
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates - Should return empty list when no duplicates exist")
    void shouldReturnEmptyDuplicateGroups() throws Exception {
        when(duplicateDetectionService.findDuplicateGroups("hospitalUser"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/equipment/duplicates")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(duplicateDetectionService).findDuplicateGroups("hospitalUser");
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should return duplicate matches for query params")
    void shouldCheckForDuplicatesSuccessfully() throws Exception {
        DuplicateMatch match = DuplicateMatch.builder()
                .id(15L)
                .name("Defibrillator Model A")
                .similarity(0.95)
                .matchedOn("SERIAL_NUMBER")
                .build();

        when(duplicateDetectionService.checkForDuplicates(
                "hospitalUser", null, "Defibrillator", "Model A", "SN100200", "EQ550"))
                .thenReturn(List.of(match));

        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("name", "Defibrillator")
                        .param("model", "Model A")
                        .param("serialNumber", "SN100200")
                        .param("equipmentCode", "EQ550")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(15))
                .andExpect(jsonPath("$[0].matchedOn").value("SERIAL_NUMBER"));

        verify(duplicateDetectionService).checkForDuplicates(
                "hospitalUser", null, "Defibrillator", "Model A", "SN100200", "EQ550");
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should return exact match flag when similarity is 1.0")
    void shouldCheckForDuplicatesExactMatch() throws Exception {
        DuplicateMatch exactMatch = DuplicateMatch.builder()
                .id(18L)
        		.name("Ventilator Pro")
        		.exact(true)
        		.similarity(1.0)
        		.matchedOn("SERIAL_NUMBER")
        		.build();

        when(duplicateDetectionService.checkForDuplicates(
                "hospitalUser", null, "Ventilator Pro", null, "SN-EXACT-100", null))
                .thenReturn(List.of(exactMatch));

        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("name", "Ventilator Pro")
                        .param("serialNumber", "SN-EXACT-100")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].exact").value(true))
                .andExpect(jsonPath("$[0].similarity").value(1.0));

        verify(duplicateDetectionService).checkForDuplicates(
                "hospitalUser", null, "Ventilator Pro", null, "SN-EXACT-100", null);
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should support querying by name and model")
    void shouldCheckForDuplicatesByNameAndModel() throws Exception {
        DuplicateMatch match = DuplicateMatch.builder()
                .id(22L)
                .name("ECG Monitor")
                .model("V3")
                .matchedOn("NAME_MODEL")
                .build();

        when(duplicateDetectionService.checkForDuplicates(
                "hospitalUser", null, "ECG Monitor", "V3", null, null))
                .thenReturn(List.of(match));

        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("name", "ECG Monitor")
                        .param("model", "V3")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(22))
                .andExpect(jsonPath("$[0].matchedOn").value("NAME_MODEL"));

        verify(duplicateDetectionService).checkForDuplicates(
                "hospitalUser", null, "ECG Monitor", "V3", null, null);
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should support valid excludeId parameter")
    void shouldCheckForDuplicatesWithValidExcludeId() throws Exception {
        when(duplicateDetectionService.checkForDuplicates(
                "hospitalUser", 20L, "Infusion Pump", null, null, null))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("name", "Infusion Pump")
                        .param("excludeId", "20")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(duplicateDetectionService).checkForDuplicates(
                "hospitalUser", 20L, "Infusion Pump", null, null, null);
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should return 400 Bad Request when excludeId is zero")
    void shouldReturnBadRequestWhenExcludeIdIsZero() throws Exception {
        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("excludeId", "0")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/equipment/duplicates/check - Should return 400 Bad Request when excludeId is negative")
    void shouldReturnBadRequestWhenExcludeIdIsNegative() throws Exception {
        mockMvc.perform(get("/api/equipment/duplicates/check")
                        .param("excludeId", "-5")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should merge duplicates when IDs are valid")
    void shouldMergeDuplicatesSuccessfully() throws Exception {
        Equipment survivingRecord = new Equipment();
        survivingRecord.setId(1L);
        survivingRecord.setName("Surviving Ultrasound Scanner");

        when(duplicateDetectionService.mergeDuplicates(1L, 2L, "hospitalUser"))
                .thenReturn(survivingRecord);

        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "1")
                        .param("mergeId", "2")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Surviving Ultrasound Scanner"));

        verify(duplicateDetectionService).mergeDuplicates(1L, 2L, "hospitalUser");
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should support merging with large ID values")
    void shouldMergeDuplicatesWithLargeIdsSuccessfully() throws Exception {
        Equipment survivingRecord = new Equipment();
        survivingRecord.setId(99999L);
        survivingRecord.setName("High Velocity Centrifuge");

        when(duplicateDetectionService.mergeDuplicates(99999L, 88888L, "hospitalUser"))
                .thenReturn(survivingRecord);

        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "99999")
                        .param("mergeId", "88888")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99999));

        verify(duplicateDetectionService).mergeDuplicates(99999L, 88888L, "hospitalUser");
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 400 Bad Request when keepId is zero")
    void shouldReturnBadRequestWhenKeepIdIsZero() throws Exception {
        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "0")
                        .param("mergeId", "2")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 400 Bad Request when keepId is negative")
    void shouldReturnBadRequestWhenKeepIdIsNegative() throws Exception {
        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "-1")
                        .param("mergeId", "2")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 400 Bad Request when mergeId is zero")
    void shouldReturnBadRequestWhenMergeIdIsZero() throws Exception {
        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "1")
                        .param("mergeId", "0")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 400 Bad Request when mergeId is negative")
    void shouldReturnBadRequestWhenMergeIdIsNegative() throws Exception {
        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "1")
                        .param("mergeId", "-2")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 400 Bad Request on self-merge attempt")
    void shouldReturnBadRequestOnSelfMergeAttempt() throws Exception {
        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "5")
                        .param("mergeId", "5")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/equipment/duplicates/merge - Should return 404 Not Found when equipment not found")
    void shouldReturnNotFoundWhenEquipmentDoesNotExist() throws Exception {
        when(duplicateDetectionService.mergeDuplicates(99L, 100L, "hospitalUser"))
                .thenThrow(new ResourceNotFoundException("Equipment not found"));

        mockMvc.perform(post("/api/equipment/duplicates/merge")
                        .param("keepId", "99")
                        .param("mergeId", "100")
                        .principal(hospitalPrincipal))
                .andExpect(status().isNotFound());

        verify(duplicateDetectionService).mergeDuplicates(99L, 100L, "hospitalUser");
    }
}
