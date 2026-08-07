package com.medtrack.auth.pam.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking Just-In-Time (JIT) privileged access elevation requests.
 */
@Entity
@Table(name = "pam_access_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamAccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String requestId; // e.g., PAM-90102

    @Column(nullable = false)
    private String requesterEmail;

    @Column(nullable = false)
    private String targetResource; // PROD_PATIENT_DB, K8S_PROD_CLUSTER, VAULT_SECRETS

    @Column(nullable = false)
    private String requestedRole; // ROLE_SYSADMIN, ROLE_DBA, ROLE_SECURITY_AUDITOR

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false, length = 1000)
    private String reason;

    private String ticketNumber; // JIRA or ServiceNow ticket

    @Column(nullable = false)
    private String status; // APPROVED, PENDING, REJECTED, EXPIRED

    private String approvedBy;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime expiresAt;
}
