package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payload for opening a fresh round of bidding on a tender. A new deadline must be supplied so a
 * reopened round never silently inherits an expired deadline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TenderRoundRequest {

    @NotNull(message = "Round number is required")
    @Positive(message = "Round number must be positive")
    private Integer round;

    @NotNull(message = "Round deadline is required")
    private LocalDateTime deadline;
}
