package com.medtrack.model;

/**
 * Depreciation methods supported for asset valuation.
 *
 * <p>New equipment defaults to {@link #STRAIGHT_LINE}.</p>
 */
public enum DepreciationMethod {
    /** Constant annual depreciation: cost divided evenly over the useful life. */
    STRAIGHT_LINE,
    /** Accelerated (double-declining): book value falls at 2 / useful life per year. */
    DECLINING_BALANCE
}
