package com.medtrack.auth.saml.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SamlIdpConfigResponse {
    private Long id;
    private String entityId;
    private String providerName;
    private String ssoUrl;
    private String certificateFingerprint;
    private String bindingType;
    private boolean signAuthnRequest;
    private boolean forceAuthn;
    private LocalDateTime updatedAt;
}
