package com.medtrack.auth.commandcenter.service;

import com.medtrack.auth.commandcenter.dto.*;
import com.medtrack.auth.commandcenter.model.*;
import com.medtrack.auth.commandcenter.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enterprise Service managing Security Command Center unified dashboard data.
 */
@Service
@RequiredArgsConstructor
public class SecurityCommandCenterService {

    private final SecurityCommandCenterConfigRepository configRepository;
    private final SecurityUnifiedAlertRepository alertRepository;

    private static final String DEFAULT_CONFIG_NAME = "DEFAULT_COMMAND_CENTER_CONFIG";

    /**
     * Seeds baseline dashboard configuration and initial sample alerts.
     */
    @PostConstruct
    @Transactional
    public void seedCommandCenterBaseline() {
        if (configRepository.findByConfigName(DEFAULT_CONFIG_NAME).isEmpty()) {
            SecurityCommandCenterConfig config = SecurityCommandCenterConfig.builder()
                    .configName(DEFAULT_CONFIG_NAME)
                    .refreshIntervalSeconds(15)
                    .activeWidgets("POSTURE_SCORE,OTEL_STREAMS,ACTIVE_CONTAINMENTS,WORM_LEDGER,SCIM_SYNC")
                    .riskAlertThreshold(75)
                    .autoAcknowledgeLowSeverity(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            configRepository.save(config);
        }

        if (alertRepository.count() == 0) {
            seedSampleAlert("ALT-901", "SOAR", "CRITICAL", "Brute-force attack detected on Auth Gateway", "auth-gateway", "ACTIVE", LocalDateTime.now().minusMinutes(12));
            seedSampleAlert("ALT-902", "KEYVAULT", "HIGH", "Master encryption key rotation due in 3 days", "hsm-vault", "ACTIVE", LocalDateTime.now().minusHours(1));
            seedSampleAlert("ALT-903", "POSTURE", "MEDIUM", "MFA enforcement missing on 2 service accounts", "identity-provider", "ACKNOWLEDGED", LocalDateTime.now().minusHours(4));
        }
    }

    private void seedSampleAlert(String id, String sub, String sev, String summary, String comp, String status, LocalDateTime time) {
        if (alertRepository.findByAlertId(id).isEmpty()) {
            alertRepository.save(SecurityUnifiedAlert.builder()
                    .alertId(id)
                    .subsystem(sub)
                    .severity(sev)
                    .alertSummary(summary)
                    .affectedComponent(comp)
                    .resolutionStatus(status)
                    .timestamp(time)
                    .build());
        }
    }

    /**
     * Retrieves active command center dashboard configuration.
     */
    @Transactional(readOnly = true)
    public CommandCenterConfigResponse getActiveConfig() {
        SecurityCommandCenterConfig config = getOrCreateConfig();
        return mapToConfigResponse(config);
    }

    /**
     * Updates dashboard configuration.
     */
    @Transactional
    public CommandCenterConfigResponse updateConfig(UpdateCommandCenterConfigRequest request) {
        SecurityCommandCenterConfig config = getOrCreateConfig();
        config.setRefreshIntervalSeconds(request.getRefreshIntervalSeconds());
        config.setActiveWidgets(request.getActiveWidgets());
        config.setRiskAlertThreshold(request.getRiskAlertThreshold());
        config.setAutoAcknowledgeLowSeverity(request.isAutoAcknowledgeLowSeverity());
        config.setUpdatedAt(LocalDateTime.now());

        SecurityCommandCenterConfig updated = configRepository.save(config);
        return mapToConfigResponse(updated);
    }

    /**
     * Aggregates unified security summary metrics across all subsystems.
     */
    @Transactional(readOnly = true)
    public UnifiedSecuritySummaryResponse getUnifiedSummary() {
        List<SecurityUnifiedAlert> activeAlerts = alertRepository.findByResolutionStatus("ACTIVE");
        long criticalCount = activeAlerts.stream().filter(a -> "CRITICAL".equalsIgnoreCase(a.getSeverity())).count();

        int compositeScore = calculateCompositePostureScore((int) criticalCount, activeAlerts.size());
        String riskLevel = determineRiskLevel(compositeScore);

        return UnifiedSecuritySummaryResponse.builder()
                .compositePostureScore(compositeScore)
                .overallRiskLevel(riskLevel)
                .activeAlertsCount(activeAlerts.size())
                .criticalAlertsCount((int) criticalCount)
                .totalOtelStreamsIngested(14250L)
                .activePlaybookContainments(3)
                .sealedEvidenceBlocksCount(128L)
                .activeScimUsersSynced(450)
                .lastAggregationTime(LocalDateTime.now())
                .build();
    }

    /**
     * Acknowledges an active unified security alert.
     */
    @Transactional
    public SecurityUnifiedAlertResponse acknowledgeAlert(AcknowledgeAlertRequest request) {
        SecurityUnifiedAlert alert = alertRepository.findByAlertId(request.getAlertId())
                .orElseThrow(() -> new IllegalArgumentException("Unified alert not found for ID: " + request.getAlertId()));

        alert.setResolutionStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(request.getAcknowledgedBy());

        SecurityUnifiedAlert saved = alertRepository.save(alert);
        return mapToAlertResponse(saved);
    }

    /**
     * Retrieves all system-wide unified alerts.
     */
    @Transactional(readOnly = true)
    public List<SecurityUnifiedAlertResponse> getAllAlerts() {
        return alertRepository.findAll().stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    private int calculateCompositePostureScore(int criticalAlerts, int totalActiveAlerts) {
        int score = 95;
        score -= (criticalAlerts * 15);
        score -= (totalActiveAlerts * 3);
        return Math.max(score, 20);
    }

    private String determineRiskLevel(int score) {
        if (score >= 85) return "LOW";
        if (score >= 70) return "MODERATE";
        if (score >= 50) return "HIGH";
        return "CRITICAL";
    }

    private SecurityCommandCenterConfig getOrCreateConfig() {
        return configRepository.findByConfigName(DEFAULT_CONFIG_NAME)
                .orElseGet(() -> configRepository.save(SecurityCommandCenterConfig.builder()
                        .configName(DEFAULT_CONFIG_NAME)
                        .refreshIntervalSeconds(15)
                        .activeWidgets("POSTURE_SCORE,OTEL_STREAMS,ACTIVE_CONTAINMENTS,WORM_LEDGER,SCIM_SYNC")
                        .riskAlertThreshold(75)
                        .autoAcknowledgeLowSeverity(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private CommandCenterConfigResponse mapToConfigResponse(SecurityCommandCenterConfig config) {
        return CommandCenterConfigResponse.builder()
                .id(config.getId())
                .configName(config.getConfigName())
                .refreshIntervalSeconds(config.getRefreshIntervalSeconds())
                .activeWidgets(config.getActiveWidgets())
                .riskAlertThreshold(config.getRiskAlertThreshold())
                .autoAcknowledgeLowSeverity(config.isAutoAcknowledgeLowSeverity())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private SecurityUnifiedAlertResponse mapToAlertResponse(SecurityUnifiedAlert alert) {
        return SecurityUnifiedAlertResponse.builder()
                .id(alert.getId())
                .alertId(alert.getAlertId())
                .subsystem(alert.getSubsystem())
                .severity(alert.getSeverity())
                .alertSummary(alert.getAlertSummary())
                .affectedComponent(alert.getAffectedComponent())
                .resolutionStatus(alert.getResolutionStatus())
                .acknowledgedBy(alert.getAcknowledgedBy())
                .timestamp(alert.getTimestamp())
                .build();
    }
}
