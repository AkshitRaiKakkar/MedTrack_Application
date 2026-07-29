package com.medtrack.auth.pam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.pam.controller.PamController;
import com.medtrack.auth.pam.dto.*;
import com.medtrack.auth.pam.service.PamService;
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
 * Controller unit tests for {@link PamController}.
 */
@ExtendWith(MockitoExtension.class)
public class PamControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PamService pamService;

    @InjectMocks
    private PamController pamController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(pamController).build();
    }

    @Test
    void getActivePolicy_Success() throws Exception {
        PamPolicyConfigResponse response = PamPolicyConfigResponse.builder()
                .policyName("MASTER_PAM_POLICY")
                .maxSessionMinutes(60)
                .autoApproveLowRisk(true)
                .build();

        when(pamService.getActivePolicy()).thenReturn(response);

        mockMvc.perform(get("/api/auth/pam/policy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policyName").value("MASTER_PAM_POLICY"))
                .andExpect(jsonPath("$.maxSessionMinutes").value(60));
    }

    @Test
    void createAccessRequest_Success() throws Exception {
        PamAccessRequestResponse response = PamAccessRequestResponse.builder()
                .requestId("PAM-90102")
                .requesterEmail("dev@medtrack-health.org")
                .status("APPROVED")
                .build();

        when(pamService.createAccessRequest(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/pam/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(CreatePamAccessRequest.builder()
                                .requesterEmail("dev@medtrack-health.org")
                                .targetResource("PROD_PATIENT_DB")
                                .requestedRole("ROLE_DBA")
                                .durationMinutes(30)
                                .reason("Emergency db patch")
                                .ticketNumber("SEC-9901")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value("PAM-90102"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
