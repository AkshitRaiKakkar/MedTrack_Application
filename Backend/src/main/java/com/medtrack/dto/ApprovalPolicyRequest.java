package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.ProcurementUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * Client-supplied fields for creating or updating an approval policy. Policies are hospital-scoped
 * and evaluated deterministically against the matching criteria.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApprovalPolicyRequest {

    @NotBlank(message = "Policy name is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Policy name must not exceed 255 characters")
    private String name;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Policy description must not exceed 255 characters")
    private String description;

    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private EquipmentCategory category;
    private ProcurementUrgency urgency;

    @Size(max = 50, message = "Requester role must not exceed 50 characters")
    private String requesterRole;

    private Boolean active;
}
