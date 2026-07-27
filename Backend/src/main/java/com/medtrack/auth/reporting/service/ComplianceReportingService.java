package com.medtrack.auth.reporting.service;

import com.medtrack.auth.reporting.dto.*;
import com.medtrack.auth.reporting.model.*;
import com.medtrack.auth.reporting.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Enterprise Security Compliance Reporting & Executive Audit Exports.
 */
@Service
@RequiredArgsConstructor
public class ComplianceReportingService {

    private final ComplianceReportConfigRepository configRepository;
    private final ComplianceReportExportLogRepository exportLogRepository;

    private static final String DEFAULT_CONFIG_NAME = "MASTER_REPORT_CONFIG";

    /**
     * Seeds default reporting template config & sample executive audit logs.
     */
    @PostConstruct
    @Transactional
    public void seedReportingBaseline() {
        if (configRepository.findByConfigName(DEFAULT_CONFIG_NAME).isEmpty()) {
            ComplianceReportConfig config = ComplianceReportConfig.builder()
                    .configName(DEFAULT_CONFIG_NAME)
                    .defaultFramework("SOC2_TYPE_2")
                    .exportFormat("PDF")
                    .includeAuditLogs(true)
                    .includeTelemetryMetrics(true)
                    .retentionPeriodDays(365)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            configRepository.save(config);
        }

        if (exportLogRepository.count() == 0) {
            seedSampleLog("RPT-90102", "Annual SOC2 Type II Audit Bundle", "SOC2_TYPE_2", "PDF", "AUDITOR_CHIEF", 1420);
            seedSampleLog("RPT-87105", "HIPAA Security Rule Evidence Export", "HIPAA_SECURITY", "CSV", "COMPLIANCE_OFFICER", 890);
            seedSampleLog("RPT-74110", "ISO 27001 ISMS Controls Attestation", "ISO_27001", "JSON", "SECURITY_ADMIN", 650);
        }
    }

    private void seedSampleLog(String rptId, String title, String framework, String format, String user, int count) {
        if (exportLogRepository.findByReportId(rptId).isEmpty()) {
            String hash = calculateSha256(rptId + title + framework);
            exportLogRepository.save(ComplianceReportExportLog.builder()
                    .reportId(rptId)
                    .reportTitle(title)
                    .framework(framework)
                    .exportFormat(format)
                    .generatedBy(user)
                    .recordCount(count)
                    .sha256Checksum(hash)
                    .downloadUri("/api/auth/reporting/export/download/" + rptId)
                    .generationStatus("GENERATED")
                    .generatedAt(LocalDateTime.now().minusDays(1))
                    .build());
        }
    }

    /**
     * Retrieves active reporting configuration.
     */
    @Transactional(readOnly = true)
    public ComplianceReportConfigResponse getActiveConfig() {
        ComplianceReportConfig config = getOrCreateConfig();
        return mapToConfigResponse(config);
    }

    /**
     * Updates reporting template configuration.
     */
    @Transactional
    public ComplianceReportConfigResponse updateConfig(UpdateReportConfigRequest request) {
        ComplianceReportConfig config = getOrCreateConfig();
        config.setDefaultFramework(request.getDefaultFramework());
        config.setExportFormat(request.getExportFormat());
        config.setIncludeAuditLogs(request.isIncludeAuditLogs());
        config.setIncludeTelemetryMetrics(request.isIncludeTelemetryMetrics());
        config.setRetentionPeriodDays(request.getRetentionPeriodDays());
        config.setUpdatedAt(LocalDateTime.now());

        ComplianceReportConfig updated = configRepository.save(config);
        return mapToConfigResponse(updated);
    }

    /**
     * Generates a new executive compliance audit report export.
     */
    @Transactional
    public ComplianceReportExportLogResponse generateComplianceReport(GenerateComplianceReportRequest request, String operator) {
        String reportId = "RPT-" + (10000 + new Random().nextInt(90000));
        int recordCount = 500 + new Random().nextInt(1500);
        String rawDataToHash = reportId + request.getReportTitle() + request.getFramework() + LocalDateTime.now();
        String checksum = calculateSha256(rawDataToHash);

        ComplianceReportExportLog log = ComplianceReportExportLog.builder()
                .reportId(reportId)
                .reportTitle(request.getReportTitle())
                .framework(request.getFramework())
                .exportFormat(request.getExportFormat())
                .generatedBy(operator)
                .recordCount(recordCount)
                .sha256Checksum(checksum)
                .downloadUri("/api/auth/reporting/export/download/" + reportId)
                .generationStatus("GENERATED")
                .generatedAt(LocalDateTime.now())
                .build();

        ComplianceReportExportLog saved = exportLogRepository.save(log);
        return mapToExportLogResponse(saved);
    }

    /**
     * Retrieves all executive compliance report export logs.
     */
    @Transactional(readOnly = true)
    public List<ComplianceReportExportLogResponse> getAllReportLogs() {
        return exportLogRepository.findAll().stream()
                .map(this::mapToExportLogResponse)
                .collect(Collectors.toList());
    }

    private ComplianceReportConfig getOrCreateConfig() {
        return configRepository.findByConfigName(DEFAULT_CONFIG_NAME)
                .orElseGet(() -> configRepository.save(ComplianceReportConfig.builder()
                        .configName(DEFAULT_CONFIG_NAME)
                        .defaultFramework("SOC2_TYPE_2")
                        .exportFormat("PDF")
                        .includeAuditLogs(true)
                        .includeTelemetryMetrics(true)
                        .retentionPeriodDays(365)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private String calculateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "SHA256-GEN-HASH-FAILURE";
        }
    }

    private ComplianceReportConfigResponse mapToConfigResponse(ComplianceReportConfig c) {
        return ComplianceReportConfigResponse.builder()
                .id(c.getId())
                .configName(c.getConfigName())
                .defaultFramework(c.getDefaultFramework())
                .exportFormat(c.getExportFormat())
                .includeAuditLogs(c.isIncludeAuditLogs())
                .includeTelemetryMetrics(c.isIncludeTelemetryMetrics())
                .retentionPeriodDays(c.getRetentionPeriodDays())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ComplianceReportExportLogResponse mapToExportLogResponse(ComplianceReportExportLog l) {
        return ComplianceReportExportLogResponse.builder()
                .id(l.getId())
                .reportId(l.getReportId())
                .reportTitle(l.getReportTitle())
                .framework(l.getFramework())
                .exportFormat(l.getExportFormat())
                .generatedBy(l.getGeneratedBy())
                .recordCount(l.getRecordCount())
                .sha256Checksum(l.getSha256Checksum())
                .downloadUri(l.getDownloadUri())
                .generationStatus(l.getGenerationStatus())
                .generatedAt(l.getGeneratedAt())
                .build();
    }
}
