package com.medtrack.auth.threatintel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriggerMitigationRequest {

    @NotBlank(message = "Indicator value is required")
    private String indicatorValue;

    @NotBlank(message = "Mitigation action is required")
    private String mitigationAction; // IP_BLOCK, DOMAIN_SINKHOLE, CONTAINER_ISOLATE
}
