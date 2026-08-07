package com.medtrack.model;

/**
 * Lifecycle state of an asset's warranty (issue #703), derived from the expiry date.
 *
 * <p>Never persisted; computed on read by {@link Equipment#getWarrantyStatus()} so the badge on
 * the inventory list and detail page always reflects today's date.</p>
 */
public enum WarrantyStatus {
    /** Covered, with more than 90 days left on the warranty. */
    ACTIVE,
    /** Covered but within 90 days of expiry - repairs should be planned before the deadline. */
    EXPIRING_SOON,
    /** The warranty period has passed; repairs are billed to the hospital. */
    EXPIRED,
    /** No expiry date recorded, so coverage is unknown. */
    NO_COVERAGE
}
