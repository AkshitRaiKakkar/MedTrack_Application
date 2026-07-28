package com.medtrack.auth.pam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordPamSessionLogRequest {

    @NotBlank(message = "Request ID is required")
    private String requestId;

    @NotBlank(message = "Operator email is required")
    private String operatorEmail;

    @NotBlank(message = "Executed action detail is required")
    private String actionExecuted;

    @Min(0)
    @Max(100)
    private int riskScore;
}
