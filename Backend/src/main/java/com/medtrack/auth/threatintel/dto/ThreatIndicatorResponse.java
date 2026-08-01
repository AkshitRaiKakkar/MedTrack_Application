package com.medtrack.auth.threatintel.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatIndicatorResponse {
    private Long id;
    private String indicatorValue;
    private String indicatorType;
    private String threatCategory;
    private int confidenceScore;
    private String status;
    private LocalDateTime discoveredAt;
    private LocalDateTime mitigatedAt;
}
