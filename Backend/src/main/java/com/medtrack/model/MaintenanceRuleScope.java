package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum MaintenanceRuleScope {
    EQUIPMENT_CATEGORY("Equipment Category"),
    INDIVIDUAL_EQUIPMENT("Individual Equipment"),
    MANUFACTURER_INTERVAL("Manufacturer Interval"),
    PRIORITY("Priority");

    private final String displayName;

    MaintenanceRuleScope(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static MaintenanceRuleScope fromValue(String value) {
        return Arrays.stream(values())
                .filter(scope -> scope.displayName.equalsIgnoreCase(value)
                        || scope.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown maintenance rule scope: " + value));
    }
}
