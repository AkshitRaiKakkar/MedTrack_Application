package com.medtrack.auth.microsegmentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.microsegmentation.controller.MicrosegmentationController;
import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.service.MicrosegmentationService;
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
 * Controller unit tests for {@link MicrosegmentationController}.
 */
@ExtendWith(MockitoExtension.class)
public class MicrosegmentationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MicrosegmentationService microsegmentationService;

    @InjectMocks
    private MicrosegmentationController microsegmentationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(microsegmentationController).build();
    }

    @Test
    void createRule_Success() throws Exception {
        MicrosegmentationPolicyResponse response = MicrosegmentationPolicyResponse.builder()
                .ruleId("SEG-90102")
                .sourceSegment("PATIENT_PORTAL_DMZ")
                .status("ACTIVE")
                .build();

        when(microsegmentationService.createRule(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/microsegmentation/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(CreateMicrosegmentationRuleRequest.builder()
                                .sourceSegment("PATIENT_PORTAL_DMZ")
                                .destinationSegment("PROD_HEALTH_DB")
                                .allowedProtocol("TCP")
                                .portRange("5432")
                                .postureRequirement("ENCRYPTED_MTLS_ONLY")
                                .action("STRICT_ALLOW")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ruleId").value("SEG-90102"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void establishTunnel_Success() throws Exception {
        SdpTunnelSessionResponse response = SdpTunnelSessionResponse.builder()
                .sessionId("SDP-87105")
                .status("ESTABLISHED")
                .userEmail("operator@medtrack-health.org")
                .build();

        when(microsegmentationService.establishTunnel(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/microsegmentation/tunnels/establish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(EstablishSdpTunnelRequest.builder()
                                .userEmail("operator@medtrack-health.org")
                                .sourceIp("10.200.4.12")
                                .targetSegment("PROD_HEALTH_DB")
                                .tunnelProtocol("WIREGUARD_UDP")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value("SDP-87105"))
                .andExpect(jsonPath("$.status").value("ESTABLISHED"));
    }
}
