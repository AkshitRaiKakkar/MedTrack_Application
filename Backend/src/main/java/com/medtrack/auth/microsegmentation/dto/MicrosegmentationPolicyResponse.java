package com.medtrack.auth.microsegmentation.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MicrosegmentationPolicyResponse {
    private Long id;
    private String ruleId;
    private String sourceSegment;
    private String destinationSegment;
    private String allowedProtocol;
    private String portRange;
    private String postureRequirement;
    private String action;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
