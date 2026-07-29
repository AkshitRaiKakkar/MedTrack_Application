package com.medtrack.auth.pam.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamSessionAuditLogResponse {
    private Long id;
    private String sessionId;
    private String requestId;
    private String operatorEmail;
    private String actionExecuted;
    private int riskScore;
    private LocalDateTime timestamp;
}
