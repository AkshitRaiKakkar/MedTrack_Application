package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatusDTO {
    private String workflowId;
    private String status;
    private String currentStep;
    private String errorDetails;
    private LocalDateTime startedAt;
    private LocalDateTime lastUpdatedAt;
}
