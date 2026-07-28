package com.medtrack.auth.sbom.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SbomAttestationReportResponse {
    private String artifactId;
    private String artifactType;
    private String sha256Digest;
    private int totalComponents;
    private int directDependenciesCount;
    private int prohibitedLicenseCount;
    private String attestationSha256Checksum;
    private String complianceVerdict; // CERTIFIED_SAFE, REJECTED_NON_COMPLIANT
    private LocalDateTime generatedAt;
}
