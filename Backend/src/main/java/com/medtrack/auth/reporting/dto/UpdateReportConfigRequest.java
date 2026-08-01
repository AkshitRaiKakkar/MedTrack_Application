package com.medtrack.auth.reporting.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateReportConfigRequest {

    @NotBlank(message = "Config name is required")
    private String configName;

    @NotBlank(message = "Default framework is required")
    private String defaultFramework;

    @NotBlank(message = "Export format is required")
    private String exportFormat;

    private boolean includeAuditLogs;
    private boolean includeTelemetryMetrics;

    @Min(value = 30, message = "Retention period must be at least 30 days")
    private int retentionPeriodDays;
}
