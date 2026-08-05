package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static com.medtrack.validation.MaintenanceValidationLimits.AMENDMENT_REASON_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/** Hospital-controlled changes to a scheduled work order. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaintenanceScheduleAmendmentRequest {

    @FutureOrPresent(message = "Amended deadline cannot be in the past")
    private LocalDate deadline;

    @Size(max = SHORT_TEXT_MAX_LENGTH,
            message = "Maintenance type must not exceed 255 characters")
    private String maintenanceType;

    @Size(max = SHORT_TEXT_MAX_LENGTH,
            message = "Description must not exceed 255 characters")
    private String description;

    @Size(max = SHORT_TEXT_MAX_LENGTH,
            message = "Priority must not exceed 255 characters")
    private String priority;

    @PositiveOrZero(message = "Recurrence period cannot be negative")
    private Integer recurrencePeriodDays;

    @NotBlank(message = "Amendment reason is required")
    @Size(max = AMENDMENT_REASON_MAX_LENGTH,
            message = "Amendment reason must not exceed 1000 characters")
    private String reason;
}
