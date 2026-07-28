package com.medtrack.auth.cspm.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CspmSecurityFindingResponse {
    private Long id;
    private String findingId;
    private String accountNumber;
    private String resourceId;
    private String resourceType;
    private String severity;
    private String benchmark;
    private String description;
    private String status;
    private String remediationCommand;
    private LocalDateTime detectedAt;
    private LocalDateTime remediatedAt;
}
