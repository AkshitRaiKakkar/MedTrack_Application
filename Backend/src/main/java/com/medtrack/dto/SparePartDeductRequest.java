package com.medtrack.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO request payload for spare part stock deduction and restocking operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SparePartDeductRequest {

    @NotBlank(message = "Part number is required")
    private String partNumber;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
