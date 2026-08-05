package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.ProcurementUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Client-supplied fields for creating a procurement request. Requester identity, ownership, the
 * request code, and workflow status are server-controlled.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProcurementRequestRequest {

    @NotBlank(message = "Equipment code is required")
    @Size(max = 100, message = "Equipment code must not exceed 100 characters")
    private String equipmentCode;

    @NotBlank(message = "Equipment name is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Equipment name must not exceed 255 characters")
    private String equipmentName;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Estimated unit cost is required")
    @PositiveOrZero(message = "Estimated unit cost cannot be negative")
    private BigDecimal unitCost;

    @NotNull(message = "Urgency is required")
    private ProcurementUrgency urgency;

    private EquipmentCategory category;

    @Size(max = 16000, message = "Notes must not exceed 16000 characters")
    private String notes;
}
