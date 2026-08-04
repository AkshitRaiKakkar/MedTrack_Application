package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.RecurrenceFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Hospital-controlled fields accepted when creating or updating a preventive-maintenance rule.
 * Ownership, idempotency, and run metadata are server-controlled.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaintenanceRuleRequest {

    @NotBlank(message = "Rule name is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Rule name must not exceed 255 characters")
    private String name;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Rule description must not exceed 255 characters")
    private String description;

    @NotNull(message = "Rule scope is required")
    private MaintenanceRuleScope ruleScope;

    private EquipmentCategory equipmentCategory;

    private Long equipmentRecordId;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Manufacturer must not exceed 255 characters")
    private String manufacturer;

    @Pattern(regexp = "Normal|High|Critical", message = "Priority must be Normal, High, or Critical")
    private String priority;

    @NotNull(message = "Recurrence frequency is required")
    private RecurrenceFrequency frequency;

    @Positive(message = "Custom interval must be positive")
    private Integer customIntervalDays;

    @NotBlank(message = "Maintenance type is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Maintenance type must not exceed 255 characters")
    private String maintenanceType;

    @PositiveOrZero(message = "SLA warning days cannot be negative")
    private Integer slaWarningDays;

    @PositiveOrZero(message = "SLA breach days cannot be negative")
    private Integer slaBreachDays;

    @Positive(message = "Lead time must be positive")
    private Integer leadTimeDays;

    private Boolean active;
}
