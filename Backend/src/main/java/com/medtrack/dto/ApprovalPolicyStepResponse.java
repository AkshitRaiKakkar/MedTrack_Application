package com.medtrack.dto;

import com.medtrack.model.ApprovalPolicyStep;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalPolicyStepResponse {

    private Long id;
    private Long policyId;
    private Integer stepGroup;
    private String approverRole;
    private String approverEmail;
    private Boolean active;

    public static ApprovalPolicyStepResponse from(ApprovalPolicyStep step) {
        return ApprovalPolicyStepResponse.builder()
                .id(step.getId())
                .policyId(step.getPolicyId())
                .stepGroup(step.getStepGroup())
                .approverRole(step.getApproverRole())
                .approverEmail(step.getApproverEmail())
                .active(step.getActive())
                .build();
    }
}
