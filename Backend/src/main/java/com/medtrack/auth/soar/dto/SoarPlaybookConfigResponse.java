package com.medtrack.auth.soar.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoarPlaybookConfigResponse {
    private Long id;
    private String playbookId;
    private String playbookName;
    private String triggerEvent;
    private String targetAction;
    private boolean autoExecutionEnabled;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
