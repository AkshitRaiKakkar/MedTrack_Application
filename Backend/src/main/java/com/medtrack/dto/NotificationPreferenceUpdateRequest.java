package com.medtrack.dto;

import com.medtrack.model.OperationsEvent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for muting or unmuting one event category for the authenticated user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceUpdateRequest {

    @NotNull(message = "Event category is required")
    private OperationsEvent.EventCategory category;

    @NotNull(message = "Muted status is required")
    private Boolean muted;
}
