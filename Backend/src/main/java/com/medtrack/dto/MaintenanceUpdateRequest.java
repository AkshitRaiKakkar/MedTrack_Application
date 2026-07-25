package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medtrack.model.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.medtrack.validation.MaintenanceValidationLimits.NOTES_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SIGNATURE_MAX_LENGTH;

/**
 * Technician-controlled partial report fields accepted for an assigned task.
 * Null optional values preserve the corresponding stored value.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaintenanceUpdateRequest {

    @NotNull(message = "Status is required")
    private MaintenanceStatus status;

    @Size(max = NOTES_MAX_LENGTH, message = "Notes must not exceed 16000 characters")
    private String notes;

    @PositiveOrZero(message = "Hours worked cannot be negative")
    private Double hoursWorked;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Parts used must not exceed 255 characters")
    private String partsUsed;
    @Size(max = SIGNATURE_MAX_LENGTH, message = "Signature must not exceed 60000 characters")
    private String signature;

    // Accepted for compatibility, but the service never changes the stored recurrence.
    @PositiveOrZero(message = "Recurrence period cannot be negative")
    private Integer recurrencePeriodDays;
}
