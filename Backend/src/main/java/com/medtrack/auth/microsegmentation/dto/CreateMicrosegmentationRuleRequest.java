package com.medtrack.auth.microsegmentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMicrosegmentationRuleRequest {

    @NotBlank(message = "Source segment is required")
    private String sourceSegment;

    @NotBlank(message = "Destination segment is required")
    private String destinationSegment;

    @NotBlank(message = "Allowed protocol is required")
    private String allowedProtocol; // TCP, UDP, ICMP

    @NotBlank(message = "Port range is required")
    private String portRange; // 5432, 443

    @NotBlank(message = "Posture requirement is required")
    private String postureRequirement; // ENCRYPTED_MTLS_ONLY, DEVICE_POSTURE_PASSED

    @NotBlank(message = "Action is required")
    private String action; // STRICT_ALLOW, BLOCK
}
