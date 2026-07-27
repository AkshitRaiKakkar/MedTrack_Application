package com.medtrack.auth.commandcenter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.commandcenter.controller.SecurityCommandCenterController;
import com.medtrack.auth.commandcenter.dto.*;
import com.medtrack.auth.commandcenter.service.SecurityCommandCenterService;
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
 * Controller unit tests for {@link SecurityCommandCenterController}.
 */
@ExtendWith(MockitoExtension.class)
public class SecurityCommandCenterControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SecurityCommandCenterService commandCenterService;

    @InjectMocks
    private SecurityCommandCenterController commandCenterController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(commandCenterController).build();
    }

    @Test
    void getUnifiedSummary_Success() throws Exception {
        UnifiedSecuritySummaryResponse response = UnifiedSecuritySummaryResponse.builder()
                .compositePostureScore(88)
                .overallRiskLevel("LOW")
                .activeAlertsCount(2)
                .criticalAlertsCount(0)
                .build();

        when(commandCenterService.getUnifiedSummary()).thenReturn(response);

        mockMvc.perform(get("/api/auth/commandcenter/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compositePostureScore").value(88))
                .andExpect(jsonPath("$.overallRiskLevel").value("LOW"));
    }

    @Test
    void acknowledgeAlert_Success() throws Exception {
        SecurityUnifiedAlertResponse response = SecurityUnifiedAlertResponse.builder()
                .alertId("ALT-901")
                .resolutionStatus("ACKNOWLEDGED")
                .acknowledgedBy("OPERATOR_BOB")
                .build();

        when(commandCenterService.acknowledgeAlert(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/commandcenter/alerts/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(AcknowledgeAlertRequest.builder()
                                .alertId("ALT-901")
                                .acknowledgedBy("OPERATOR_BOB")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertId").value("ALT-901"))
                .andExpect(jsonPath("$.resolutionStatus").value("ACKNOWLEDGED"));
    }
}
