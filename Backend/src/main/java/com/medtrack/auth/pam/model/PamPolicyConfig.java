package com.medtrack.auth.pam.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing Privileged Access Management (PAM) policy configuration.
 */
@Entity
@Table(name = "pam_policy_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PamPolicyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String policyName; // e.g., MASTER_PAM_POLICY

    @Column(nullable = false)
    private int maxSessionMinutes; // e.g. 60 min default limit

    @Column(nullable = false)
    private boolean autoApproveLowRisk;

    @Column(nullable = false)
    private boolean requireMfaElevation;

    @Column(nullable = false)
    private boolean requireTicketNumber;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
