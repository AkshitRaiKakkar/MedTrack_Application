package com.medtrack.auth.cspm.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking Cloud Security Posture Management (CSPM) misconfigurations & CIS benchmark findings.
 */
@Entity
@Table(name = "cspm_security_findings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CspmSecurityFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String findingId; // e.g., CSPM-90102

    @Column(nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String resourceId; // s3://medtrack-patient-records, arn:aws:iam::123:role/Admin

    @Column(nullable = false)
    private String resourceType; // S3_BUCKET, IAM_ROLE, K8S_CLUSTER, SECURITY_GROUP

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String benchmark; // CIS_AWS_FOUNDATIONS_1_5, HIPAA_CLOUD_SECURITY

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String status; // OPEN, REMEDIATED, SUPPRESSED

    @Column(length = 1000)
    private String remediationCommand; // CLI / Terraform auto-remediation snippet

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    private LocalDateTime remediatedAt;
}
