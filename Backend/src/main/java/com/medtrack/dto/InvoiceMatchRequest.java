package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Hospital-supplied invoice metadata used for three-way matching.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class InvoiceMatchRequest {

    @NotBlank(message = "Invoice number is required")
    @Size(max = 100, message = "Invoice number must not exceed 100 characters")
    private String invoiceNumber;

    @NotNull(message = "Invoice amount is required")
    @PositiveOrZero(message = "Invoice amount cannot be negative")
    private BigDecimal invoiceAmount;

    private LocalDate invoiceDate;

    @Size(max = 16000, message = "Notes must not exceed 16000 characters")
    private String notes;
}
