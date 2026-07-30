package com.medtrack.auth.commandcenter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityUnifiedAlertResponse {
    private Long id;
    private String alertId;
    private String subsystem;
    private String severity;
    private String alertSummary;
    private String affectedComponent;
    private String resolutionStatus;
    private String acknowledgedBy;
    private LocalDateTime timestamp;
}
