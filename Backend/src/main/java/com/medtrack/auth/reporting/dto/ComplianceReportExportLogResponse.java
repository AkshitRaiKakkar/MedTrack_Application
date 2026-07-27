package com.medtrack.auth.reporting.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReportExportLogResponse {
    private Long id;
    private String reportId;
    private String reportTitle;
    private String framework;
    private String exportFormat;
    private String generatedBy;
    private int recordCount;
    private String sha256Checksum;
    private String downloadUri;
    private String generationStatus;
    private LocalDateTime generatedAt;
}
