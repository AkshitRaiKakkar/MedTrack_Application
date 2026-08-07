package com.medtrack.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * Payload for assigning a piece of equipment to a location (issue #745).
 */
@Data
public class LocationAssignRequest {
    private Long locationId;
    private LocalDate effectiveDate;
    private String notes;
}