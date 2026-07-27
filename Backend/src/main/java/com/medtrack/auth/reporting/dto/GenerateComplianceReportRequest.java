package com.medtrack.auth.reporting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateComplianceReportRequest {

    @NotBlank(message = "Report title is required")
    private String reportTitle;

    @NotBlank(message = "Framework is required")
    private String framework; // SOC2_TYPE_2, HIPAA_SECURITY, ISO_27001

    @NotBlank(message = "Export format is required")
    private String exportFormat; // PDF, CSV, JSON
}
