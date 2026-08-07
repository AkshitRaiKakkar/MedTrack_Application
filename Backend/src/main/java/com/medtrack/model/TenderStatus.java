package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

/**
 * Lifecycle of a multi-supplier tender / e-auction.
 *
 * <p>DRAFT      - created but not yet visible to suppliers
 * OPEN        - published; suppliers may submit bids for the current round
 * CLOSED      - current round closed; bids are final and can be compared
 * AWARDED     - a winning bid has been chosen and recorded for audit
 * CANCELLED   - withdrawn before award, no bids accepted any further</p>
 */
public enum TenderStatus {
    DRAFT("Draft"),
    OPEN("Open"),
    CLOSED("Closed"),
    AWARDED("Awarded"),
    CANCELLED("Cancelled");

    private final String displayName;

    TenderStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static TenderStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status -> status.displayName.equalsIgnoreCase(value)
                        || status.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown tender status: " + value));
    }
}
