package com.medtrack.auth.commandcenter.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcknowledgeAlertRequest {

    @NotBlank(message = "Alert ID is required")
    private String alertId;

    @NotBlank(message = "Acknowledged by operator is required")
    private String acknowledgedBy;
}
