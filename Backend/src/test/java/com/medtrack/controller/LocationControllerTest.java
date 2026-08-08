package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.LocationAssignRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLocationHistory;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.LocationType;
import com.medtrack.service.LocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LocationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private LocationService locationService;

    @InjectMocks
    private LocationController locationController;

    private ObjectMapper objectMapper;
    private Principal hospitalPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(locationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        hospitalPrincipal = new UsernamePasswordAuthenticationToken(
                "hospitalUser",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL"))
        );
    }

    @Test
    @DisplayName("GET /api/locations - Should return location tree for authenticated user")
    void shouldReturnLocationTree() throws Exception {
        FacilityLocation location = new FacilityLocation();
        location.setId(10L);
        location.setName("ICU Ward A");

        when(locationService.getLocationTree("hospitalUser")).thenReturn(List.of(location));

        mockMvc.perform(get("/api/locations")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].name").value("ICU Ward A"));

        verify(locationService).getLocationTree("hospitalUser");
    }

    @Test
    @DisplayName("GET /api/locations - Should return empty list when no locations exist")
    void shouldReturnEmptyLocationTree() throws Exception {
        when(locationService.getLocationTree("hospitalUser")).thenReturn(List.of());

        mockMvc.perform(get("/api/locations")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(locationService).getLocationTree("hospitalUser");
    }

    @Test
    @DisplayName("POST /api/locations - Should create location successfully")
    void shouldCreateLocationSuccessfully() throws Exception {
        FacilityLocation newLocation = new FacilityLocation();
        newLocation.setName("Radiology Department");
        newLocation.setLocationType(LocationType.ROOM);

        FacilityLocation createdLocation = new FacilityLocation();
        createdLocation.setId(20L);
        createdLocation.setName("Radiology Department");
        createdLocation.setLocationType(LocationType.ROOM);

        when(locationService.createLocation(any(FacilityLocation.class), eq("hospitalUser")))
                .thenReturn(createdLocation);

        mockMvc.perform(post("/api/locations")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLocation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.name").value("Radiology Department"));

        verify(locationService).createLocation(any(FacilityLocation.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("POST /api/locations - Should return 400 Bad Request when location name is blank")
    void shouldReturnBadRequestWhenCreateLocationNameIsBlank() throws Exception {
        FacilityLocation invalidLocation = new FacilityLocation();
        invalidLocation.setName("");
        invalidLocation.setLocationType(LocationType.ROOM);

        mockMvc.perform(post("/api/locations")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLocation)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/locations/{id} - Should update location when ID is valid")
    void shouldUpdateLocationSuccessfully() throws Exception {
        FacilityLocation updateLocation = new FacilityLocation();
        updateLocation.setName("Renovated ICU");
        updateLocation.setLocationType(LocationType.ROOM);

        when(locationService.updateLocation(eq(10L), any(FacilityLocation.class), eq("hospitalUser")))
                .thenReturn(updateLocation);

        mockMvc.perform(put("/api/locations/10")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateLocation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renovated ICU"));

        verify(locationService).updateLocation(eq(10L), any(FacilityLocation.class), eq("hospitalUser"));
    }

    @Test
    @DisplayName("PUT /api/locations/{id} - Should return 400 Bad Request when update location name is blank")
    void shouldReturnBadRequestWhenUpdateLocationNameIsBlank() throws Exception {
        FacilityLocation invalidLocation = new FacilityLocation();
        invalidLocation.setName("   ");
        invalidLocation.setLocationType(LocationType.ROOM);

        mockMvc.perform(put("/api/locations/10")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLocation)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/locations/{id} - Should return 400 Bad Request when path ID is invalid")
    void shouldReturnBadRequestWhenUpdateLocationIdInvalid() throws Exception {
        FacilityLocation updateLocation = new FacilityLocation();
        updateLocation.setName("Renovated ICU");

        mockMvc.perform(put("/api/locations/-1")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateLocation)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/locations/{id} - Should delete location when ID is valid")
    void shouldDeleteLocationSuccessfully() throws Exception {
        doNothing().when(locationService).deleteLocation(10L, "hospitalUser");

        mockMvc.perform(delete("/api/locations/10")
                        .principal(hospitalPrincipal))
                .andExpect(status().isNoContent());

        verify(locationService).deleteLocation(10L, "hospitalUser");
    }

    @Test
    @DisplayName("DELETE /api/locations/{id} - Should return 400 Bad Request when path ID is zero")
    void shouldReturnBadRequestWhenDeleteLocationIdZero() throws Exception {
        mockMvc.perform(delete("/api/locations/0")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/locations/equipment/{equipmentId}/history - Should return location history")
    void shouldReturnEquipmentLocationHistory() throws Exception {
        EquipmentLocationHistory history = new EquipmentLocationHistory();
        history.setId(100L);
        history.setEffectiveDate(LocalDate.now());

        when(locationService.getEquipmentLocationHistory(5L, "hospitalUser"))
                .thenReturn(List.of(history));

        mockMvc.perform(get("/api/locations/equipment/5/history")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100));

        verify(locationService).getEquipmentLocationHistory(5L, "hospitalUser");
    }

    @Test
    @DisplayName("GET /api/locations/equipment/{equipmentId}/history - Should return empty list when no history exists")
    void shouldReturnEmptyEquipmentLocationHistory() throws Exception {
        when(locationService.getEquipmentLocationHistory(5L, "hospitalUser"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/locations/equipment/5/history")
                        .principal(hospitalPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(locationService).getEquipmentLocationHistory(5L, "hospitalUser");
    }

    @Test
    @DisplayName("GET /api/locations/equipment/{equipmentId}/history - Should return 400 Bad Request for negative equipment ID")
    void shouldReturnBadRequestForNegativeEquipmentHistoryId() throws Exception {
        mockMvc.perform(get("/api/locations/equipment/-5/history")
                        .principal(hospitalPrincipal))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/locations/equipment/{equipmentId}/assign - Should assign equipment to location")
    void shouldAssignEquipmentToLocationSuccessfully() throws Exception {
        LocationAssignRequest request = LocationAssignRequest.builder()
                .locationId(10L)
                .effectiveDate(LocalDate.now())
                .notes("Transferred to ICU")
                .build();

        Equipment equipment = new Equipment();
        equipment.setId(5L);

        when(locationService.assignEquipmentToLocation(
                eq(5L), eq(10L), any(LocalDate.class), eq("Transferred to ICU"), eq("hospitalUser")))
                .thenReturn(equipment);

        mockMvc.perform(post("/api/locations/equipment/5/assign")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));

        verify(locationService).assignEquipmentToLocation(
                eq(5L), eq(10L), any(LocalDate.class), eq("Transferred to ICU"), eq("hospitalUser"));
    }

    @Test
    @DisplayName("POST /api/locations/equipment/{equipmentId}/assign - Should return 400 Bad Request when locationId is null")
    void shouldReturnBadRequestWhenAssignRequestLocationIdNull() throws Exception {
        LocationAssignRequest request = LocationAssignRequest.builder()
                .locationId(null)
                .notes("Missing Location ID")
                .build();

        mockMvc.perform(post("/api/locations/equipment/5/assign")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/locations/equipment/{equipmentId}/assign - Should return 400 Bad Request when equipmentId is invalid")
    void shouldReturnBadRequestWhenAssignEquipmentIdInvalid() throws Exception {
        LocationAssignRequest request = LocationAssignRequest.builder()
                .locationId(10L)
                .build();

        mockMvc.perform(post("/api/locations/equipment/-1/assign")
                        .principal(hospitalPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
