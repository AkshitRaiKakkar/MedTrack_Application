package com.medtrack.auth.cspm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterCloudAccountRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Cloud provider is required")
    private String provider; // AWS, AZURE, GCP

    @NotBlank(message = "Account name is required")
    private String accountName;

    @NotBlank(message = "Region is required")
    private String region;
}
