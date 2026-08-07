package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
 * Supplier-submitted bid for a tender round.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TenderBidRequest {

    @NotNull(message = "Bid amount is required")
    @PositiveOrZero(message = "Bid amount cannot be negative")
    private BigDecimal bidAmount;

    @Positive(message = "Lead time must be positive")
    private Integer leadTimeDays;

    @Min(value = 0, message = "Quality score must be between 0 and 100")
    @Max(value = 100, message = "Quality score must be between 0 and 100")
    private Integer qualityScore;

    @Min(value = 0, message = "Delivery score must be between 0 and 100")
    @Max(value = 100, message = "Delivery score must be between 0 and 100")
    private Integer deliveryScore;

    @Size(max = 16000, message = "Notes must not exceed 16000 characters")
    private String notes;
}
