package com.medtrack.auth.sbom.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SbomArtifactConfigResponse {
    private Long id;
    private String artifactId;
    private String artifactType;
    private String sha256Digest;
    private String complianceStatus;
    private LocalDateTime scannedAt;
    private LocalDateTime updatedAt;
}
