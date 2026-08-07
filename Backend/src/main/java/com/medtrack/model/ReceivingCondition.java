package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum ReceivingCondition {
    EXCELLENT("Excellent"),
    GOOD("Good"),
    DAMAGED("Damaged"),
    MISSING("Missing");

    private final String displayName;

    ReceivingCondition(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ReceivingCondition fromValue(String value) {
        return Arrays.stream(values())
                .filter(condition -> condition.displayName.equalsIgnoreCase(value)
                        || condition.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown receiving condition: " + value));
    }
}
