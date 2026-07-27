package com.medtrack.auth.commandcenter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandCenterConfigResponse {
    private Long id;
    private String configName;
    private int refreshIntervalSeconds;
    private String activeWidgets;
    private int riskAlertThreshold;
    private boolean autoAcknowledgeLowSeverity;
    private LocalDateTime updatedAt;
}
