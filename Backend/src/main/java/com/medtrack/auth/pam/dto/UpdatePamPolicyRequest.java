package com.medtrack.auth.pam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePamPolicyRequest {

    @NotBlank(message = "Policy name is required")
    private String policyName;

    @Min(value = 5, message = "Max session time must be at least 5 minutes")
    @Max(value = 480, message = "Max session time cannot exceed 8 hours")
    private int maxSessionMinutes;

    private boolean autoApproveLowRisk;
    private boolean requireMfaElevation;
    private boolean requireTicketNumber;
}
