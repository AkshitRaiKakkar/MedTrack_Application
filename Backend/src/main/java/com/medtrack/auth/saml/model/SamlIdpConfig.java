package com.medtrack.auth.saml.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing enterprise SAML 2.0 Identity Provider (IdP) configuration.
 */
@Entity
@Table(name = "saml_idp_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SamlIdpConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String entityId; // e.g., https://idp.okta.com/app/medtrack-sso

    @Column(nullable = false)
    private String providerName; // OKTA, AZURE_AD, PING_IDENTITY, ONELOGIN

    @Column(nullable = false)
    private String ssoUrl; // Single Sign-On endpoint

    @Column(nullable = false, length = 1000)
    private String certificateFingerprint; // SHA-256 x509 cert fingerprint

    @Column(nullable = false)
    private String bindingType; // HTTP_POST, HTTP_REDIRECT

    @Column(nullable = false)
    private boolean signAuthnRequest;

    @Column(nullable = false)
    private boolean forceAuthn;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
