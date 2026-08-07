package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to add a step to a policy. Step groups run sequentially; steps sharing a group must all
 * approve (parallel approval).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApprovalPolicyStepRequest {

    @NotNull(message = "Step group is required")
    @Positive(message = "Step group must be positive")
    private Integer stepGroup;

    @NotBlank(message = "Approver role is required")
    private String approverRole;

    private String approverEmail;
}
