package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for awarding a tender to one of the submitted bids.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TenderAwardRequest {

    @NotNull(message = "Winning bid is required")
    @Positive(message = "Winning bid must be a valid bid id")
    private Long bidId;

    @Size(max = 16000, message = "Award reason must not exceed 16000 characters")
    private String reason;
}
