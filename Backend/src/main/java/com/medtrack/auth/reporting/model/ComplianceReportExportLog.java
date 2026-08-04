package com.medtrack.auth.reporting.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking generated executive compliance audit report exports.
 */
@Entity
@Table(name = "compliance_report_export_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReportExportLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reportId; // e.g., RPT-99102

    @Column(nullable = false)
    private String reportTitle;

    @Column(nullable = false)
    private String framework; // SOC2_TYPE_2, HIPAA_SECURITY, ISO_27001

    @Column(nullable = false)
    private String exportFormat; // PDF, CSV, JSON

    @Column(nullable = false)
    private String generatedBy;

    @Column(nullable = false)
    private int recordCount;

    @Column(nullable = false)
    private String sha256Checksum;

    @Column(nullable = false)
    private String downloadUri;

    @Column(nullable = false)
    private String generationStatus; // GENERATED, PENDING, FAILED

    @Column(nullable = false)
    private LocalDateTime generatedAt;
}
