package com.medtrack.auth.saml.service;

import com.medtrack.auth.saml.dto.*;
import com.medtrack.auth.saml.model.*;
import com.medtrack.auth.saml.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Enterprise SAML 2.0 Identity Federation & SSO Assertion Validation.
 */
@Service
@RequiredArgsConstructor
public class SamlIdentityProviderService {

    private final SamlIdpConfigRepository idpConfigRepository;
    private final SamlSessionLogRepository sessionLogRepository;

    private static final String DEFAULT_ENTITY_ID = "https://idp.okta.com/app/medtrack-sso";

    /**
     * Seeds baseline SAML 2.0 Identity Provider configuration & sample session logs.
     */
    @PostConstruct
    @Transactional
    public void seedSamlBaseline() {
        if (idpConfigRepository.findByEntityId(DEFAULT_ENTITY_ID).isEmpty()) {
            SamlIdpConfig config = SamlIdpConfig.builder()
                    .entityId(DEFAULT_ENTITY_ID)
                    .providerName("OKTA")
                    .ssoUrl("https://idp.okta.com/app/medtrack-sso/sso/saml")
                    .certificateFingerprint("SHA256:7B:3E:9A:1F:C4:8D:2E:5A:6F:0D:3C:9B:8A:1E:4F:7D:2C:5B:8E:0A:3F:6D:9C:1B")
                    .bindingType("HTTP_POST")
                    .signAuthnRequest(true)
                    .forceAuthn(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            idpConfigRepository.save(config);
        }

        if (sessionLogRepository.count() == 0) {
            seedSampleSession("SAML-90102", "chief.security@medtrack-health.org", DEFAULT_ENTITY_ID, "VALIDATED");
            seedSampleSession("SAML-87105", "hospital.admin@medtrack-health.org", DEFAULT_ENTITY_ID, "VALIDATED");
            seedSampleSession("SAML-74110", "doctor.smith@medtrack-health.org", DEFAULT_ENTITY_ID, "VALIDATED");
        }
    }

    private void seedSampleSession(String assertionId, String nameId, String idp, String status) {
        if (sessionLogRepository.findByAssertionId(assertionId).isEmpty()) {
            sessionLogRepository.save(SamlSessionLog.builder()
                    .assertionId(assertionId)
                    .nameId(nameId)
                    .idpEntityId(idp)
                    .authContextClass("urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport")
                    .assertionStatus(status)
                    .authenticatedAt(LocalDateTime.now().minusHours(2))
                    .expiresAt(LocalDateTime.now().plusHours(6))
                    .build());
        }
    }

    /**
     * Retrieves active SAML 2.0 IdP configuration.
     */
    @Transactional(readOnly = true)
    public SamlIdpConfigResponse getActiveConfig() {
        SamlIdpConfig config = getOrCreateConfig();
        return mapToConfigResponse(config);
    }

    /**
     * Updates SAML 2.0 IdP configuration settings.
     */
    @Transactional
    public SamlIdpConfigResponse updateConfig(UpdateSamlConfigRequest request) {
        SamlIdpConfig config = getOrCreateConfig();
        config.setEntityId(request.getEntityId());
        config.setProviderName(request.getProviderName());
        config.setSsoUrl(request.getSsoUrl());
        config.setCertificateFingerprint(request.getCertificateFingerprint());
        config.setBindingType(request.getBindingType());
        config.setSignAuthnRequest(request.isSignAuthnRequest());
        config.setForceAuthn(request.isForceAuthn());
        config.setUpdatedAt(LocalDateTime.now());

        SamlIdpConfig updated = idpConfigRepository.save(config);
        return mapToConfigResponse(updated);
    }

    /**
     * Validates and processes incoming SAML 2.0 XML assertion.
     */
    @Transactional
    public SamlSessionLogResponse processSamlAssertion(ProcessSamlAssertionRequest request) {
        String assertionId = "SAML-" + (10000 + new Random().nextInt(90000));
        
        // Simulates XML Signature verification & assertion validity check
        boolean isValid = request.getSamlResponsePayloadXml() != null && !request.getSamlResponsePayloadXml().isBlank();
        String status = isValid ? "VALIDATED" : "INVALID_SIGNATURE";

        SamlSessionLog log = SamlSessionLog.builder()
                .assertionId(assertionId)
                .nameId(request.getNameId())
                .idpEntityId(request.getIdpEntityId())
                .authContextClass("urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport")
                .assertionStatus(status)
                .authenticatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(8))
                .build();

        SamlSessionLog saved = sessionLogRepository.save(log);
        return mapToSessionLogResponse(saved);
    }

    /**
     * Retrieves all validated SAML SSO session logs.
     */
    @Transactional(readOnly = true)
    public List<SamlSessionLogResponse> getAllSessionLogs() {
        return sessionLogRepository.findAll().stream()
                .map(this::mapToSessionLogResponse)
                .collect(Collectors.toList());
    }

    private SamlIdpConfig getOrCreateConfig() {
        return idpConfigRepository.findByEntityId(DEFAULT_ENTITY_ID)
                .orElseGet(() -> idpConfigRepository.save(SamlIdpConfig.builder()
                        .entityId(DEFAULT_ENTITY_ID)
                        .providerName("OKTA")
                        .ssoUrl("https://idp.okta.com/app/medtrack-sso/sso/saml")
                        .certificateFingerprint("SHA256:7B:3E:9A:1F:C4:8D:2E:5A:6F:0D:3C:9B:8A:1E:4F:7D:2C:5B:8E:0A:3F:6D:9C:1B")
                        .bindingType("HTTP_POST")
                        .signAuthnRequest(true)
                        .forceAuthn(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private SamlIdpConfigResponse mapToConfigResponse(SamlIdpConfig c) {
        return SamlIdpConfigResponse.builder()
                .id(c.getId())
                .entityId(c.getEntityId())
                .providerName(c.getProviderName())
                .ssoUrl(c.getSsoUrl())
                .certificateFingerprint(c.getCertificateFingerprint())
                .bindingType(c.getBindingType())
                .signAuthnRequest(c.isSignAuthnRequest())
                .forceAuthn(c.isForceAuthn())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private SamlSessionLogResponse mapToSessionLogResponse(SamlSessionLog s) {
        return SamlSessionLogResponse.builder()
                .id(s.getId())
                .assertionId(s.getAssertionId())
                .nameId(s.getNameId())
                .idpEntityId(s.getIdpEntityId())
                .authContextClass(s.getAuthContextClass())
                .assertionStatus(s.getAssertionStatus())
                .authenticatedAt(s.getAuthenticatedAt())
                .expiresAt(s.getExpiresAt())
                .build();
    }
}
