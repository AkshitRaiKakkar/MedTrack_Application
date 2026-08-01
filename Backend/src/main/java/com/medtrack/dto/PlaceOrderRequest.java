package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Hospital-controlled fields accepted when placing an equipment order.
 * Identity (hospital, createdBy), order code, and workflow/approval status are server-derived.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlaceOrderRequest {

    @NotBlank(message = "Equipment ID is required")
    @Size(max = 100, message = "Equipment ID must not exceed 100 characters")
    private String equipmentId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}
