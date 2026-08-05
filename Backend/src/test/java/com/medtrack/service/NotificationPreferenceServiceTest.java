package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.NotificationPreferenceResponse;
import com.medtrack.model.NotificationPreference;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.NotificationPreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

    private static final String EMAIL = "hospital@medtrack.com";

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private NotificationPreferenceService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(42L).email(EMAIL).build();
    }

    @Test
    void getPreferences_DefaultsEveryCategoryToNotMuted() {
        when(authentication.getName()).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(preferenceRepository.findByUserId(42L)).thenReturn(List.of());

        NotificationPreferenceResponse response = service.getPreferences(authentication);

        assertEquals(OperationsEvent.EventCategory.values().length, response.getMuted().size());
        assertTrue(response.getMuted().values().stream().allMatch(muted -> !muted));
    }

    @Test
    void getPreferences_ReflectsStoredMuteState() {
        when(authentication.getName()).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(preferenceRepository.findByUserId(42L)).thenReturn(List.of(
                NotificationPreference.builder()
                        .userId(42L)
                        .category(OperationsEvent.EventCategory.SHIPMENT)
                        .muted(true)
                        .build()));

        NotificationPreferenceResponse response = service.getPreferences(authentication);

        assertTrue(response.getMuted().get(OperationsEvent.EventCategory.SHIPMENT));
        assertFalse(response.getMuted().get(OperationsEvent.EventCategory.EQUIPMENT));
    }

    @Test
    void setPreference_CreatesRowWhenNoneExists() {
        when(authentication.getName()).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(preferenceRepository.findByUserIdAndCategory(42L, OperationsEvent.EventCategory.MAINTENANCE))
                .thenReturn(Optional.empty());
        when(preferenceRepository.findByUserId(42L)).thenReturn(List.of());

        service.setPreference(authentication, OperationsEvent.EventCategory.MAINTENANCE, true);

        ArgumentCaptor<NotificationPreference> captor = ArgumentCaptor.forClass(NotificationPreference.class);
        verify(preferenceRepository).save(captor.capture());
        assertEquals(42L, captor.getValue().getUserId());
        assertEquals(OperationsEvent.EventCategory.MAINTENANCE, captor.getValue().getCategory());
        assertTrue(captor.getValue().getMuted());
    }

    @Test
    void setPreference_UpdatesExistingRowInsteadOfDuplicating() {
        NotificationPreference existing = NotificationPreference.builder()
                .id(9L)
                .userId(42L)
                .category(OperationsEvent.EventCategory.SLA)
                .muted(true)
                .build();
        when(authentication.getName()).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(preferenceRepository.findByUserIdAndCategory(42L, OperationsEvent.EventCategory.SLA))
                .thenReturn(Optional.of(existing));
        when(preferenceRepository.findByUserId(42L)).thenReturn(List.of(existing));

        service.setPreference(authentication, OperationsEvent.EventCategory.SLA, false);

        ArgumentCaptor<NotificationPreference> captor = ArgumentCaptor.forClass(NotificationPreference.class);
        verify(preferenceRepository).save(captor.capture());
        assertEquals(9L, captor.getValue().getId());
        assertFalse(captor.getValue().getMuted());
    }

    @Test
    void getPreferences_RejectsUnauthenticatedCaller() {
        when(authentication.getName()).thenReturn(null);

        assertThrows(AccessDeniedException.class, () -> service.getPreferences(authentication));
    }
}
