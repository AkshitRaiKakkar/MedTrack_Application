package com.medtrack.model;

/**
 * State of a decommissioning / disposal record (issue #744).
 *
 * <p>The workflow mirrors the equipment lifecycle approval chain: a staff member requests the
 * disposal, a manager approves it, data sanitisation is confirmed for devices that stored
 * patient or operational data, and only then is the record completed - at which point the asset
 * moves to {@link EquipmentStatus#DISPOSED} and a certificate of disposal is generated.</p>
 */
public enum EquipmentDisposalStatus {
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    COMPLETED,
    CANCELLED
}
