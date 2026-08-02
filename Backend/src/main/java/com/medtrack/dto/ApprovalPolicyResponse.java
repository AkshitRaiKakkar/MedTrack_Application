package com.medtrack.dto;

import com.medtrack.model.ApprovalPolicy;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.ProcurementUrgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalPolicyResponse {

    private Long id;
    private Long hospitalId;
    private String name;
    private String description;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private EquipmentCategory category;
    private ProcurementUrgency urgency;
    private String requesterRole;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ApprovalPolicyStepResponse> steps;

    public static ApprovalPolicyResponse from(ApprovalPolicy policy, List<ApprovalPolicyStepResponse> steps) {
        return ApprovalPolicyResponse.builder()
                .id(policy.getId())
                .hospitalId(policy.getHospitalId())
                .name(policy.getName())
                .description(policy.getDescription())
                .minAmount(policy.getMinAmount())
                .maxAmount(policy.getMaxAmount())
                .category(policy.getCategory())
                .urgency(policy.getUrgency())
                .requesterRole(policy.getRequesterRole())
                .active(policy.getActive())
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .steps(steps)
                .build();
    }
}
