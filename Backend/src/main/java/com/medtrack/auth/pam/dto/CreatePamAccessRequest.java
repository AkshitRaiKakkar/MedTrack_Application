package com.medtrack.auth.pam.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePamAccessRequest {

    @NotBlank(message = "Requester email is required")
    private String requesterEmail;

    @NotBlank(message = "Target resource is required")
    private String targetResource;

    @NotBlank(message = "Requested role is required")
    private String requestedRole;

    @Min(value = 5, message = "Duration must be at least 5 minutes")
    private int durationMinutes;

    @NotBlank(message = "Reason for elevation is required")
    private String reason;

    private String ticketNumber;
}
