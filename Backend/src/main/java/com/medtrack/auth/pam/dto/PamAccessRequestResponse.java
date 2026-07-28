package com.medtrack.auth.pam.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamAccessRequestResponse {
    private Long id;
    private String requestId;
    private String requesterEmail;
    private String targetResource;
    private String requestedRole;
    private int durationMinutes;
    private String reason;
    private String ticketNumber;
    private String status;
    private String approvedBy;
    private LocalDateTime requestedAt;
    private LocalDateTime expiresAt;
}
