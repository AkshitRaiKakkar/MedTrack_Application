package com.medtrack.model;

import java.util.Arrays;
import java.util.Locale;

/**
 * Stable event categories exposed by the maintenance task history API.
 */
public enum MaintenanceActivityType {
    TASK_CREATED,
    TECHNICIAN_ASSIGNED,
    TECHNICIAN_REASSIGNED,
    STATUS_CHANGED,
    WORK_DETAILS_UPDATED,
    SCHEDULE_AMENDED,
    TASK_ARCHIVED;

    public static MaintenanceActivityType fromFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(type -> type.name().equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown maintenance activity type: " + value));
    }
}
