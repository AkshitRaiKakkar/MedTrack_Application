package com.medtrack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Payload for assigning a piece of equipment to a location (issue #745).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationAssignRequest {

    @NotNull(message = "Location ID is required")
    private Long locationId;

    private LocalDate effectiveDate;

    private String notes;
}