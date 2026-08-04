package com.medtrack.auth.reporting.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing enterprise compliance reporting configuration & template rules.
 */
@Entity
@Table(name = "compliance_report_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReportConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configName; // e.g., MASTER_REPORT_CONFIG

    @Column(nullable = false)
    private String defaultFramework; // SOC2_TYPE_2, HIPAA_SECURITY, ISO_27001, GDPR

    @Column(nullable = false)
    private String exportFormat; // PDF, CSV, JSON

    @Column(nullable = false)
    private boolean includeAuditLogs;

    @Column(nullable = false)
    private boolean includeTelemetryMetrics;

    @Column(nullable = false)
    private int retentionPeriodDays;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
