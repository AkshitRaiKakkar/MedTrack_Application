package com.medtrack.auth.threatintel.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestIndicatorRequest {

    @NotBlank(message = "Indicator value is required")
    private String indicatorValue;

    @NotBlank(message = "Indicator type is required")
    private String indicatorType; // IP_ADDRESS, DOMAIN_NAME, FILE_HASH

    @NotBlank(message = "Threat category is required")
    private String threatCategory; // MALWARE_C2, PHISHING, RANSOMWARE

    @Min(0)
    @Max(100)
    private int confidenceScore;
}
