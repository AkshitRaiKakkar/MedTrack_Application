package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload for creating a tender requirement. Suppliers are invited by email; only invited
 * supplier accounts may bid once the tender is published.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TenderRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 16000, message = "Description must not exceed 16000 characters")
    private String description;

    @Size(max = 16000, message = "Specifications must not exceed 16000 characters")
    private String specifications;

    @Size(max = 64, message = "Category must not exceed 64 characters")
    private String category;

    @Positive(message = "Quantity must be at least 1")
    private Integer quantity;

    @PositiveOrZero(message = "Estimated budget cannot be negative")
    private BigDecimal estimatedBudget;

    @NotNull(message = "Bid deadline is required")
    private LocalDateTime deadline;

    /**
     * Emails of the suppliers invited to bid. May be empty for a public tender - in that case any
     * active supplier account may bid. When non-empty, only listed suppliers may bid.
     */
    private List<@Size(max = 255, message = "Supplier email must not exceed 255 characters") String> invitedSupplierEmails;
}
