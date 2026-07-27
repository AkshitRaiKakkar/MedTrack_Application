package com.medtrack.auth.commandcenter.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCommandCenterConfigRequest {

    @NotBlank(message = "Config name is required")
    private String configName;

    @Min(value = 5, message = "Refresh interval must be at least 5 seconds")
    private int refreshIntervalSeconds;

    @NotBlank(message = "Active widgets are required")
    private String activeWidgets; // POSTURE_SCORE,OTEL_STREAMS,ACTIVE_CONTAINMENTS,WORM_LEDGER,SCIM_SYNC

    @Min(value = 1)
    @Max(value = 100)
    private int riskAlertThreshold;

    private boolean autoAcknowledgeLowSeverity;
}
