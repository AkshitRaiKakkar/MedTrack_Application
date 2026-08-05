package com.medtrack.dto;

import com.medtrack.model.OperationsEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO listing mute state per event category for the authenticated user.
 * Categories absent from a stored preference are reported as not muted.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceResponse {

    private Map<OperationsEvent.EventCategory, Boolean> muted;
}
