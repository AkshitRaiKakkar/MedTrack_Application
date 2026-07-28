package com.medtrack.auth.soar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriggerPlaybookExecutionRequest {

    @NotBlank(message = "Playbook ID is required")
    private String playbookId;

    @NotBlank(message = "Trigger source is required")
    private String triggerSource; // SIEM_ALERT, THREAT_INTEL, SOC_OPERATOR

    @NotBlank(message = "Affected resource is required")
    private String affectedResource; // host-10.0.4.12, user@medtrack.org, 192.168.1.100
}
