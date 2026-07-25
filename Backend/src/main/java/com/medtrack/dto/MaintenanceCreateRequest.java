package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Hospital-controlled fields accepted when scheduling maintenance.
 * Identity, ownership, workflow status, and technician evidence are server-controlled.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaintenanceCreateRequest {

    @NotBlank(message = "Equipment ID is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Equipment ID must not exceed 255 characters")
    private String equipmentId;

    @NotBlank(message = "Maintenance type is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Maintenance type must not exceed 255 characters")
    private String maintenanceType;

    @NotNull(message = "Deadline is required")
    private LocalDate deadline;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Assigned technician must not exceed 255 characters")
    private String assignedTechnician;
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Description must not exceed 255 characters")
    private String description;

    @NotBlank(message = "Priority is required")
    @Pattern(regexp = "Normal|High|Critical", message = "Priority must be Normal, High, or Critical")
    private String priority;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Image reference must not exceed 255 characters")
    private String image;

    @PositiveOrZero(message = "Recurrence period cannot be negative")
    private Integer recurrencePeriodDays;
}
