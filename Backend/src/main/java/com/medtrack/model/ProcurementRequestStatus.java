package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum ProcurementRequestStatus {
    REQUESTED("Requested"),
    AWAITING_APPROVAL("Awaiting Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    ORDERED("Ordered"),
    PARTIALLY_RECEIVED("Partially Received"),
    RECEIVED("Received"),
    INVOICE_PENDING("Invoice Pending"),
    INVOICE_MATCHED("Invoice Matched"),
    CLOSED("Closed"),
    CANCELLED("Cancelled");

    private final String displayName;

    ProcurementRequestStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ProcurementRequestStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status -> status.displayName.equalsIgnoreCase(value)
                        || status.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown procurement request status: " + value));
    }
}
