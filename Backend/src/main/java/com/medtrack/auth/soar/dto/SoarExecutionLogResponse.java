package com.medtrack.auth.soar.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoarExecutionLogResponse {
    private Long id;
    private String executionId;
    private String playbookId;
    private String triggerSource;
    private String affectedResource;
    private String status;
    private String outputLog;
    private LocalDateTime executedAt;
}
