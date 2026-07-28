package com.medtrack.auth.pam.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity capturing action logs during an elevated PAM session.
 */
@Entity
@Table(name = "pam_session_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamSessionAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sessionId; // e.g., SES-90102

    @Column(nullable = false)
    private String requestId;

    @Column(nullable = false)
    private String operatorEmail;

    @Column(nullable = false, length = 1000)
    private String actionExecuted; // e.g. kubectl exec -it prod-pod / ALTER TABLE patients

    @Column(nullable = false)
    private int riskScore; // 0 to 100

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
