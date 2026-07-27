package com.medtrack.auth.threatintel.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatMitigationLogResponse {
    private Long id;
    private String mitigationId;
    private String indicatorValue;
    private String mitigationAction;
    private String executedBy;
    private String executionStatus;
    private String details;
    private LocalDateTime executedAt;
}
