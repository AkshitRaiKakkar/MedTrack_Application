package com.medtrack.auth.threatintel.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFeedConfigRequest {

    @NotBlank(message = "Feed name is required")
    private String feedName;

    @NotBlank(message = "Provider name is required")
    private String providerName;

    @Min(value = 1, message = "Update interval must be at least 1 hour")
    private int updateIntervalHours;

    @Min(0)
    @Max(100)
    private int minimumConfidenceScore;

    private boolean autoBlockHighConfidence;
}
