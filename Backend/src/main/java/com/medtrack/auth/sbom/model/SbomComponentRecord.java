package com.medtrack.auth.sbom.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking open-source dependency components & software bill of materials (SBOM).
 */
@Entity
@Table(name = "sbom_component_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SbomComponentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String componentId; // e.g., SBOM-90102

    @Column(nullable = false)
    private String artifactId;

    @Column(nullable = false)
    private String packageName; // spring-boot-starter-security, react-router-dom

    @Column(nullable = false)
    private String packageVersion; // 3.2.1

    @Column(nullable = false)
    private String ecosystem; // MAVEN, NPM, PYPI, GO

    @Column(nullable = false)
    private String licenseType; // APACHE_2_0, MIT, GPL_3_0, PROHIBITED

    @Column(nullable = false)
    private String riskLevel; // LOW, HIGH, PROHIBITED_LICENSE

    @Column(nullable = false)
    private boolean directDependency;

    @Column(nullable = false)
    private LocalDateTime detectedAt;
}
