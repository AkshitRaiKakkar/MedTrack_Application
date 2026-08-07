package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

/**
 * State of an individual bid within a tender round.
 *
 * <p>SUBMITTED - bid is in play for the current round
 * WITHDRAWN  - supplier retracted the bid before the round closed
 * ACCEPTED   - the winning bid after the hospital awards the tender
 * REJECTED   - losing bids marked once a winner is chosen</p>
 */
public enum TenderBidStatus {
    SUBMITTED("Submitted"),
    WITHDRAWN("Withdrawn"),
    ACCEPTED("Accepted"),
    REJECTED("Rejected");

    private final String displayName;

    TenderBidStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static TenderBidStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status -> status.displayName.equalsIgnoreCase(value)
                        || status.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown tender bid status: " + value));
    }
}
