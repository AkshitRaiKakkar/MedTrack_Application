package com.medtrack.controller;

import com.medtrack.dto.NotificationPreferenceResponse;
import com.medtrack.dto.NotificationPreferenceUpdateRequest;
import com.medtrack.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the authenticated user's per-category notification mute preferences.
 */
@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<NotificationPreferenceResponse> getPreferences(Authentication authentication) {
        return ResponseEntity.ok(preferenceService.getPreferences(authentication));
    }

    @PutMapping
    public ResponseEntity<NotificationPreferenceResponse> updatePreference(
            @Valid @RequestBody NotificationPreferenceUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(preferenceService.setPreference(
                authentication, request.getCategory(), request.getMuted()));
    }
}
