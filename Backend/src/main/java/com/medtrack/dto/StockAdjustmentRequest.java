package com.medtrack.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for {@code PATCH /api/equipment/{id}/stock}.
 *
 * <p>Stock movement is expressed as a <em>delta</em> rather than an absolute quantity. Receiving a
 * shipment of 5 units is {@code delta = 5}; consuming 2 is {@code delta = -2}. Two concurrent
 * absolute writes would silently lose one of the movements ("last write wins"), whereas two deltas
 * applied to the same row compose correctly.</p>
 *
 * <p>{@code minimumStock} is optional here so a reorder threshold can be re-tuned in the same call
 * that records a movement, without forcing callers who only want to move stock to restate it.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    /**
     * Signed change to apply to the current quantity. Must be supplied and must not be zero: a
     * no-op adjustment is almost always a client bug, and silently accepting it hides that.
     */
    @NotNull(message = "Stock delta is required")
    private Integer delta;

    /**
     * Optional new reorder threshold. When {@code null} the existing threshold is left untouched.
     */
    private Integer minimumStock;

    /**
     * Optional free-text reason recorded in the audit log alongside the movement.
     */
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}
