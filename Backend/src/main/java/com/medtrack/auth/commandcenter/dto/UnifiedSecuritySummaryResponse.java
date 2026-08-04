package com.medtrack.auth.commandcenter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnifiedSecuritySummaryResponse {
    private int compositePostureScore; // 0-100%
    private String overallRiskLevel; // LOW, MODERATE, HIGH, CRITICAL
    private int activeAlertsCount;
    private int criticalAlertsCount;
    private long totalOtelStreamsIngested;
    private int activePlaybookContainments;
    private long sealedEvidenceBlocksCount;
    private int activeScimUsersSynced;
    private LocalDateTime lastAggregationTime;
}
