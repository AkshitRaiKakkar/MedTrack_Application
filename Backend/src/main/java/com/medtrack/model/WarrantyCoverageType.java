package com.medtrack.model;

/**
 * What a warranty or service contract covers (issue #703).
 *
 * <p>Stored as an enum constant so the CSV import/export can round-trip it unambiguously and the
 * UI can render a friendly label for each value.</p>
 */
public enum WarrantyCoverageType {
    FULL_PARTS_AND_LABOR,
    PARTS_ONLY,
    LABOR_ONLY
}
