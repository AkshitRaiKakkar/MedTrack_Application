package com.medtrack.dto;

import lombok.Builder;
import lombok.Data;

/**
 * A single probable duplicate discovered while checking a record being created or edited
 * (issue #746).
 *
 * <p>{@code matchedOn} says which attribute trip-wired the match so the UI can explain the
 * warning; {@code exact} distinguishes "identical after normalisation" (the audit red flag) from
 * a fuzzy near-tie that staff may legitimately dismiss.</p>
 */
@Data
@Builder
public class DuplicateMatch {
    private Long id;
    private String equipmentCode;
    private String name;
    private String model;
    private String serialNumber;
    private String department;
    private boolean exact;
    private double similarity;
    private String matchedOn;
}