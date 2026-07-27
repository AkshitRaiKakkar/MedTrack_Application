package com.medtrack.auth.saml.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSamlConfigRequest {

    @NotBlank(message = "Entity ID is required")
    private String entityId;

    @NotBlank(message = "Provider name is required")
    private String providerName; // OKTA, AZURE_AD, PING_IDENTITY

    @NotBlank(message = "SSO URL is required")
    private String ssoUrl;

    @NotBlank(message = "Certificate fingerprint is required")
    private String certificateFingerprint;

    @NotBlank(message = "Binding type is required")
    private String bindingType; // HTTP_POST, HTTP_REDIRECT

    private boolean signAuthnRequest;
    private boolean forceAuthn;
}
