package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregate view returned by {@code GET /api/equipment/low-stock/summary}.
 *
 * <p>The hospital dashboard only needs counts to render its inventory tiles. Without this endpoint
 * it has to call {@code GET /api/equipment/low-stock} and measure the array length, which transfers
 * every matching row — including the ones it never displays — on every dashboard poll.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockSummaryResponse {

    /** Total equipment records owned by the hospital. */
    private long totalTrackedItems;

    /** Items where {@code quantity <= minimumStock}, including those already at zero. */
    private long lowStockItems;

    /** Items where {@code quantity == 0}. Always a subset of {@link #lowStockItems}. */
    private long outOfStockItems;

    /** Sum of {@code quantity} across every item the hospital owns. */
    private long totalUnitsInStock;
}
