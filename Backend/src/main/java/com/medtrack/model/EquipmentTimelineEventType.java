package com.medtrack.model;

/**
 * Lifecycle event kinds shown on the per-asset timeline (issue #704).
 *
 * <p>The timeline aggregates existing records - purchase date, lifecycle actions, maintenance
 * tasks, operations events - into one chronological view, so no new event capture is needed.
 * The type drives the icon and colour of each entry in the UI.</p>
 */
public enum EquipmentTimelineEventType {
    PURCHASED,
    REGISTERED,
    ASSIGNED,
    MOVED,
    RETIRED,
    DISPOSED,
    REPLACED,
    DEPRECIATION_SNAPSHOT,
    MAINTENANCE_SCHEDULED,
    MAINTENANCE_COMPLETED,
    MAINTENANCE_OVERDUE,
    WARRANTY_ALERT,
    STATUS_CHANGED,
    OTHER
}
