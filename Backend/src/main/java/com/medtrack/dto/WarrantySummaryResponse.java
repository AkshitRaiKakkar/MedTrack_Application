package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for {@code GET /api/equipment/warranty-summary}.
 *
 * <p>The four buckets are <strong>disjoint and exhaustive</strong>:
 * {@code expired + expiringSoon + valid + unknown == total}. That property did not hold before —
 * the endpoint returned a {@code Map<String, Long>} in which {@code expiringSoon} was a subset of
 * {@code valid} while being presented as a peer, so the numbers summed to more than the total, and
 * equipment with no warranty date was silently counted as covered.</p>
 *
 * <p>Returned as a typed response rather than a map so those definitions live somewhere a consumer
 * can read them, instead of being implied by map keys.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantySummaryResponse {

    /** Every equipment record owned by the hospital. */
    private long total;

    /** Warranty expiry is in the past. */
    private long expired;

    /** Warranty expires within the next 30 days, inclusive. Not yet expired. */
    private long expiringSoon;

    /** Warranty expires more than 30 days from now. */
    private long valid;

    /**
     * No warranty expiry date recorded.
     *
     * <p>Reported separately rather than folded into {@link #valid}. For a system whose purpose is
     * tracking warranty coverage of medical equipment, "we do not know" and "it is covered" are
     * materially different answers, and the previous {@code total - expired} arithmetic conflated
     * them.</p>
     */
    private long unknown;
}
