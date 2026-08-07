package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One entry of the per-asset lifecycle timeline (issue #704).
 *
 * <p>Entries are aggregated from existing records - the purchase date, lifecycle actions,
 * maintenance tasks and operations events - and presented in chronological order. The source
 * tells the UI where a record came from; the actor and status change make the timeline usable
 * in audits without opening the underlying pages.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentTimelineEntry {

    /** Record kind shown as the icon and colour of the entry. */
    private com.medtrack.model.EquipmentTimelineEventType type;

    /** Short headline, e.g. "Transferred to ICU" or "Maintenance completed". */
    private String title;

    /** Longer detail assembled from the underlying record. */
    private String description;

    /** When the event happened (fractional for actions and tasks, day start for the purchase). */
    private LocalDateTime date;

    /** Who performed the event: requester, technician, event actor, or "System". */
    private String actor;

    /** The status change the event caused, e.g. "ACTIVE → UNDER_MAINTENANCE". Null when none. */
    private String statusChange;

    /** Which record the entry was built from: PURCHASE, LIFECYCLE, MAINTENANCE or OPERATIONS. */
    private String source;

    /** Stable id of the underlying record, for deep-linking. Null for derived entries. */
    private Long sourceId;
}
