package com.medtrack.auth.reporting.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReportConfigResponse {
    private Long id;
    private String configName;
    private String defaultFramework;
    private String exportFormat;
    private boolean includeAuditLogs;
    private boolean includeTelemetryMetrics;
    private int retentionPeriodDays;
    private LocalDateTime updatedAt;
}
