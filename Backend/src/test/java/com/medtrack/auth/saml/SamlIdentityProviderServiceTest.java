package com.medtrack.auth.saml;

import com.medtrack.auth.saml.dto.*;
import com.medtrack.auth.saml.model.*;
import com.medtrack.auth.saml.repository.*;
import com.medtrack.auth.saml.service.SamlIdentityProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SamlIdentityProviderService}.
 */
@ExtendWith(MockitoExtension.class)
public class SamlIdentityProviderServiceTest {

    @Mock
    private SamlIdpConfigRepository idpConfigRepository;

    @Mock
    private SamlSessionLogRepository sessionLogRepository;

    private SamlIdentityProviderService samlService;

    @BeforeEach
    void setUp() {
        samlService = new SamlIdentityProviderService(idpConfigRepository, sessionLogRepository);
    }

    @Test
    void getActiveConfig_Success() {
        SamlIdpConfig config = SamlIdpConfig.builder()
                .id(1L)
                .entityId("https://idp.okta.com/app/medtrack-sso")
                .providerName("OKTA")
                .ssoUrl("https://idp.okta.com/sso")
                .certificateFingerprint("SHA256:AA:BB:CC")
                .bindingType("HTTP_POST")
                .signAuthnRequest(true)
                .updatedAt(LocalDateTime.now())
                .build();

        when(idpConfigRepository.findByEntityId("https://idp.okta.com/app/medtrack-sso")).thenReturn(Optional.of(config));

        SamlIdpConfigResponse response = samlService.getActiveConfig();

        assertNotNull(response);
        assertEquals("OKTA", response.getProviderName());
        assertEquals("HTTP_POST", response.getBindingType());
        assertTrue(response.isSignAuthnRequest());
    }

    @Test
    void processSamlAssertion_Success() {
        when(sessionLogRepository.save(any())).thenAnswer(i -> {
            SamlSessionLog s = i.getArgument(0);
            s.setId(1L);
            return s;
        });

        ProcessSamlAssertionRequest request = ProcessSamlAssertionRequest.builder()
                .nameId("user@medtrack-health.org")
                .idpEntityId("https://idp.okta.com/app/medtrack-sso")
                .samlResponsePayloadXml("<samlp:Response xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\">...</samlp:Response>")
                .build();

        SamlSessionLogResponse response = samlService.processSamlAssertion(request);

        assertNotNull(response);
        assertEquals("user@medtrack-health.org", response.getNameId());
        assertEquals("VALIDATED", response.getAssertionStatus());
        assertNotNull(response.getAssertionId());
    }
}
