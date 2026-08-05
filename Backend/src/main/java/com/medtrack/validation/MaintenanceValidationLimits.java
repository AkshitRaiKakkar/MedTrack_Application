package com.medtrack.validation;

/**
 * Shared request and persistence limits for Maintenance text fields.
 */
public final class MaintenanceValidationLimits {

    public static final int SHORT_TEXT_MAX_LENGTH = 255;
    public static final int NOTES_MAX_LENGTH = 16_000;
    public static final int SIGNATURE_MAX_LENGTH = 60_000;
    public static final int AMENDMENT_REASON_MAX_LENGTH = 1_000;

    private MaintenanceValidationLimits() {
    }
}
