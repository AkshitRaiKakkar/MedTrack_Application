package com.medtrack.auth.pam.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamPolicyConfigResponse {
    private Long id;
    private String policyName;
    private int maxSessionMinutes;
    private boolean autoApproveLowRisk;
    private boolean requireMfaElevation;
    private boolean requireTicketNumber;
    private LocalDateTime updatedAt;
}
