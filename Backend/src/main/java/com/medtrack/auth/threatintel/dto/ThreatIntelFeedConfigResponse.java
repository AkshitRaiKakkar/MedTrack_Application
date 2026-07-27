package com.medtrack.auth.threatintel.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatIntelFeedConfigResponse {
    private Long id;
    private String feedName;
    private String providerName;
    private int updateIntervalHours;
    private int minimumConfidenceScore;
    private boolean autoBlockHighConfidence;
    private LocalDateTime updatedAt;
}
