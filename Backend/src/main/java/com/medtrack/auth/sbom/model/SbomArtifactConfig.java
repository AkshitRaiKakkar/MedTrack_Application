package com.medtrack.auth.sbom.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an enterprise container image or build artifact tracked for SBOM compliance.
 */
@Entity
@Table(name = "sbom_artifact_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SbomArtifactConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String artifactId; // e.g., medtrack-backend-api:v2.4.0

    @Column(nullable = false)
    private String artifactType; // DOCKER_IMAGE, MAVEN_JAR, NPM_PACKAGE

    @Column(nullable = false)
    private String sha256Digest; // 64-char SHA256 build checksum

    @Column(nullable = false)
    private String complianceStatus; // COMPLIANT, NON_COMPLIANT, PENDING_SCAN

    @Column(nullable = false)
    private LocalDateTime scannedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
