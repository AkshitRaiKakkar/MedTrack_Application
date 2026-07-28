package com.medtrack.auth.sbom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestSbomComponentRequest {

    @NotBlank(message = "Artifact ID is required")
    private String artifactId;

    @NotBlank(message = "Package name is required")
    private String packageName;

    @NotBlank(message = "Package version is required")
    private String packageVersion;

    @NotBlank(message = "Ecosystem is required")
    private String ecosystem; // MAVEN, NPM, PYPI

    @NotBlank(message = "License type is required")
    private String licenseType; // APACHE_2_0, MIT, GPL_3_0, PROHIBITED

    private boolean directDependency;
}
