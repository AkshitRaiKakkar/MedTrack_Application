package com.medtrack.auth.sbom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterSbomArtifactRequest {

    @NotBlank(message = "Artifact ID is required")
    private String artifactId;

    @NotBlank(message = "Artifact type is required")
    private String artifactType; // DOCKER_IMAGE, MAVEN_JAR, NPM_PACKAGE

    @NotBlank(message = "SHA-256 digest checksum is required")
    private String sha256Digest;
}
