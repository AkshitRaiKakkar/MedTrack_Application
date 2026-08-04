package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum SlaState {
    UPCOMING("Upcoming"),
    WARNING("Warning"),
    BREACHED("Breached"),
    ESCALATED("Escalated"),
    COMPLETED("Completed");

    private final String displayName;

    SlaState(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static SlaState fromValue(String value) {
        return Arrays.stream(values())
                .filter(state -> state.displayName.equalsIgnoreCase(value)
                        || state.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown SLA state: " + value));
    }
}
