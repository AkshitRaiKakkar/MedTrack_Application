package com.medtrack.dto;

import com.medtrack.model.ApprovalStep;
import com.medtrack.model.ApprovalStepStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStepResponse {

    private Long id;
    private Long requestId;
    private Integer stepGroup;
    private String approverRole;
    private String approverEmail;
    private ApprovalStepStatus status;
    private String comment;
    private String decidedBy;
    private LocalDateTime decidedAt;

    public static ApprovalStepResponse from(ApprovalStep step) {
        return ApprovalStepResponse.builder()
                .id(step.getId())
                .requestId(step.getRequestId())
                .stepGroup(step.getStepGroup())
                .approverRole(step.getApproverRole())
                .approverEmail(step.getApproverEmail())
                .status(step.getStatus())
                .comment(step.getComment())
                .decidedBy(step.getDecidedBy())
                .decidedAt(step.getDecidedAt())
                .build();
    }
}
