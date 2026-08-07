package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.NotificationPreferenceResponse;
import com.medtrack.model.NotificationPreference;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Per-user notification category mute preferences, backing the Activity Center's
 * "mute this category" control. A missing row for a category means it is not muted.
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreferences(Authentication authentication) {
        Long userId = getAuthenticatedUserId(authentication);
        return new NotificationPreferenceResponse(mutedMapFor(userId));
    }

    @Transactional
    public NotificationPreferenceResponse setPreference(Authentication authentication,
                                                          OperationsEvent.EventCategory category,
                                                          boolean muted) {
        if (category == null) {
            throw new IllegalArgumentException("Category is required");
        }
        Long userId = getAuthenticatedUserId(authentication);

        NotificationPreference preference = preferenceRepository
                .findByUserIdAndCategory(userId, category)
                .orElseGet(() -> NotificationPreference.builder()
                        .userId(userId)
                        .category(category)
                        .build());
        preference.setMuted(muted);
        preferenceRepository.save(preference);

        return new NotificationPreferenceResponse(mutedMapFor(userId));
    }

    private Map<OperationsEvent.EventCategory, Boolean> mutedMapFor(Long userId) {
        Map<OperationsEvent.EventCategory, Boolean> result = new EnumMap<>(OperationsEvent.EventCategory.class);
        for (OperationsEvent.EventCategory category : OperationsEvent.EventCategory.values()) {
            result.put(category, Boolean.FALSE);
        }
        List<NotificationPreference> stored = preferenceRepository.findByUserId(userId);
        for (NotificationPreference preference : stored) {
            result.put(preference.getCategory(), Boolean.TRUE.equals(preference.getMuted()));
        }
        return result;
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An authenticated account is required");
        }
        String normalizedEmail = authentication.getName().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AccessDeniedException("An authenticated account is required"));
        return user.getId();
    }
}
