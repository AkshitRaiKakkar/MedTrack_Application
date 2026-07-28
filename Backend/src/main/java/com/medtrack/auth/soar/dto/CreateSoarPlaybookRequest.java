package com.medtrack.auth.soar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSoarPlaybookRequest {

    @NotBlank(message = "Playbook name is required")
    private String playbookName;

    @NotBlank(message = "Trigger event is required")
    private String triggerEvent; // HIGH_SEVERITY_ALERT, MALWARE_DETECTED

    @NotBlank(message = "Target action is required")
    private String targetAction; // ISOLATE_HOST, REVOKE_SESSION, BLOCK_IP

    private boolean autoExecutionEnabled;
}
