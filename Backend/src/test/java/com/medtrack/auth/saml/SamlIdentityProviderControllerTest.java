package com.medtrack.auth.saml;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.saml.controller.SamlIdentityProviderController;
import com.medtrack.auth.saml.dto.*;
import com.medtrack.auth.saml.service.SamlIdentityProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller unit tests for {@link SamlIdentityProviderController}.
 */
@ExtendWith(MockitoExtension.class)
public class SamlIdentityProviderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SamlIdentityProviderService samlService;

    @InjectMocks
    private SamlIdentityProviderController samlController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(samlController).build();
    }

    @Test
    void getActiveConfig_Success() throws Exception {
        SamlIdpConfigResponse response = SamlIdpConfigResponse.builder()
                .entityId("https://idp.okta.com/app/medtrack-sso")
                .providerName("OKTA")
                .bindingType("HTTP_POST")
                .build();

        when(samlService.getActiveConfig()).thenReturn(response);

        mockMvc.perform(get("/api/auth/saml/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerName").value("OKTA"))
                .andExpect(jsonPath("$.bindingType").value("HTTP_POST"));
    }

    @Test
    void processSamlAssertion_Success() throws Exception {
        SamlSessionLogResponse response = SamlSessionLogResponse.builder()
                .assertionId("SAML-90102")
                .nameId("user@medtrack-health.org")
                .assertionStatus("VALIDATED")
                .build();

        when(samlService.processSamlAssertion(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/saml/assertion/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(ProcessSamlAssertionRequest.builder()
                                .nameId("user@medtrack-health.org")
                                .idpEntityId("https://idp.okta.com/app/medtrack-sso")
                                .samlResponsePayloadXml("<saml/>")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assertionId").value("SAML-90102"))
                .andExpect(jsonPath("$.assertionStatus").value("VALIDATED"));
    }
}
