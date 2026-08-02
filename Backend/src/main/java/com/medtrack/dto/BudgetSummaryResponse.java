package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Aggregated budget picture for a hospital: the total budget, the amount reserved by open
 * requests, and what remains available for new requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryResponse {

    private BigDecimal totalBudget;
    private BigDecimal reserved;
    private BigDecimal available;

    public BudgetSummaryResponse withAvailable(BigDecimal available) {
        this.available = available;
        return this;
    }
}
