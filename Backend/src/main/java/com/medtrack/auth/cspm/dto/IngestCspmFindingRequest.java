package com.medtrack.auth.cspm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestCspmFindingRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Resource type is required")
    private String resourceType; // S3_BUCKET, IAM_ROLE, K8S_CLUSTER

    @NotBlank(message = "Severity is required")
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @NotBlank(message = "Benchmark is required")
    private String benchmark; // CIS_AWS_FOUNDATIONS_1_5, HIPAA_CLOUD_SECURITY

    @NotBlank(message = "Description is required")
    private String description;

    private String remediationCommand;
}
