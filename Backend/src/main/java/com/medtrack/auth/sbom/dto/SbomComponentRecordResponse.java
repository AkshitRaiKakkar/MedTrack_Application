package com.medtrack.auth.sbom.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SbomComponentRecordResponse {
    private Long id;
    private String componentId;
    private String artifactId;
    private String packageName;
    private String packageVersion;
    private String ecosystem;
    private String licenseType;
    private String riskLevel;
    private boolean directDependency;
    private LocalDateTime detectedAt;
}
