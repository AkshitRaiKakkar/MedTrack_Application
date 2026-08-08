package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.NotificationPreferenceResponse;
import com.medtrack.dto.NotificationPreferenceUpdateRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.model.OperationsEvent;
import com.medtrack.service.NotificationPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationPreferenceService preferenceService;

    @InjectMocks
    private NotificationPreferenceController preferenceController;

    private ObjectMapper objectMapper;
    private Authentication authUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(preferenceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        authUser = new UsernamePasswordAuthenticationToken(
                "user@hospital.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL"))
        );
    }

    @Test
    @DisplayName("GET /api/notifications/preferences - Should return user notification preferences map")
    void shouldGetPreferencesSuccessfully() throws Exception {
        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        for (OperationsEvent.EventCategory category : OperationsEvent.EventCategory.values()) {
            map.put(category, Boolean.FALSE);
        }
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.getPreferences(any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(get("/api/notifications/preferences")
                        .principal(authUser))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted").exists());

        verify(preferenceService).getPreferences(any(Authentication.class));
    }

    @Test
    @DisplayName("GET /api/notifications/preferences - Should return muted state when categories are muted")
    void shouldGetPreferencesWhenSomeMuted() throws Exception {
        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        for (OperationsEvent.EventCategory category : OperationsEvent.EventCategory.values()) {
            map.put(category, Boolean.FALSE);
        }
        map.put(OperationsEvent.EventCategory.EQUIPMENT, Boolean.TRUE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.getPreferences(any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(get("/api/notifications/preferences")
                        .principal(authUser))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.EQUIPMENT").value(true));

        verify(preferenceService).getPreferences(any(Authentication.class));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should mute category successfully")
    void shouldUpdatePreferenceMuteToTrue() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.MAINTENANCE)
                .muted(true)
                .build();

        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        map.put(OperationsEvent.EventCategory.MAINTENANCE, Boolean.TRUE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.MAINTENANCE),
                eq(true)))
                .thenReturn(response);

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.MAINTENANCE").value(true));

        verify(preferenceService).setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.MAINTENANCE),
                eq(true));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should unmute category successfully")
    void shouldUpdatePreferenceMuteToFalse() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.MAINTENANCE)
                .muted(false)
                .build();

        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        map.put(OperationsEvent.EventCategory.MAINTENANCE, Boolean.FALSE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.MAINTENANCE),
                eq(false)))
                .thenReturn(response);

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.MAINTENANCE").value(false));

        verify(preferenceService).setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.MAINTENANCE),
                eq(false));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should update preference for PROCUREMENT category")
    void shouldUpdatePreferenceForProcurementCategory() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.PROCUREMENT)
                .muted(true)
                .build();

        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        map.put(OperationsEvent.EventCategory.PROCUREMENT, Boolean.TRUE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.PROCUREMENT),
                eq(true)))
                .thenReturn(response);

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.PROCUREMENT").value(true));

        verify(preferenceService).setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.PROCUREMENT),
                eq(true));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should update preference for SHIPMENT category")
    void shouldUpdatePreferenceForShipmentCategory() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.SHIPMENT)
                .muted(true)
                .build();

        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        map.put(OperationsEvent.EventCategory.SHIPMENT, Boolean.TRUE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.SHIPMENT),
                eq(true)))
                .thenReturn(response);

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.SHIPMENT").value(true));

        verify(preferenceService).setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.SHIPMENT),
                eq(true));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should update preference for SLA category")
    void shouldUpdatePreferenceForSlaCategory() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.SLA)
                .muted(false)
                .build();

        Map<OperationsEvent.EventCategory, Boolean> map = new EnumMap<>(OperationsEvent.EventCategory.class);
        map.put(OperationsEvent.EventCategory.SLA, Boolean.FALSE);
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(map);

        when(preferenceService.setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.SLA),
                eq(false)))
                .thenReturn(response);

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muted.SLA").value(false));

        verify(preferenceService).setPreference(
                any(Authentication.class),
                eq(OperationsEvent.EventCategory.SLA),
                eq(false));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should return 400 Bad Request when category is null")
    void shouldReturnBadRequestWhenCategoryIsNull() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(null)
                .muted(true)
                .build();

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should return 400 Bad Request when muted is null")
    void shouldReturnBadRequestWhenMutedIsNull() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.MAINTENANCE)
                .muted(null)
                .build();

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should return 400 Bad Request when both fields are null")
    void shouldReturnBadRequestWhenBothFieldsAreNull() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(null)
                .muted(null)
                .build();

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/notifications/preferences - Should return 403 Forbidden when AccessDeniedException is thrown")
    void shouldReturnForbiddenWhenAccessDeniedExceptionThrown() throws Exception {
        when(preferenceService.getPreferences(any(Authentication.class)))
                .thenThrow(new AccessDeniedException("An authenticated account is required"));

        mockMvc.perform(get("/api/notifications/preferences")
                        .principal(authUser))
                .andExpect(status().isForbidden());

        verify(preferenceService).getPreferences(any(Authentication.class));
    }

    @Test
    @DisplayName("PUT /api/notifications/preferences - Should return 400 Bad Request when IllegalArgumentException is thrown")
    void shouldReturnBadRequestWhenIllegalArgumentExceptionThrown() throws Exception {
        NotificationPreferenceUpdateRequest request = NotificationPreferenceUpdateRequest.builder()
                .category(OperationsEvent.EventCategory.MAINTENANCE)
                .muted(true)
                .build();

        when(preferenceService.setPreference(any(Authentication.class), any(), eq(true)))
                .thenThrow(new IllegalArgumentException("Category is required"));

        mockMvc.perform(put("/api/notifications/preferences")
                        .principal(authUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(preferenceService).setPreference(any(Authentication.class), any(), eq(true));
    }
}
