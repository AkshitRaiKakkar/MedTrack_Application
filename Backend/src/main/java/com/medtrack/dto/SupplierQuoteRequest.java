package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Supplier-supplied quote for a procurement request's RFQ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SupplierQuoteRequest {

    @NotNull(message = "Quote amount is required")
    @PositiveOrZero(message = "Quote amount cannot be negative")
    private BigDecimal quoteAmount;

    @Positive(message = "Lead time must be positive")
    private Integer leadTimeDays;

    @PositiveOrZero(message = "Warranty months cannot be negative")
    private Integer warrantyMonths;

    @Size(max = 16000, message = "Notes must not exceed 16000 characters")
    private String notes;
}
