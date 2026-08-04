package com.medtrack.auth.cspm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.cspm.controller.CspmController;
import com.medtrack.auth.cspm.dto.*;
import com.medtrack.auth.cspm.service.CspmService;
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
 * Controller unit tests for {@link CspmController}.
 */
@ExtendWith(MockitoExtension.class)
public class CspmControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CspmService cspmService;

    @InjectMocks
    private CspmController cspmController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cspmController).build();
    }

    @Test
    void registerCloudAccount_Success() throws Exception {
        CspmCloudAccountResponse response = CspmCloudAccountResponse.builder()
                .accountNumber("AWS-19203910")
                .provider("AWS")
                .syncStatus("ACTIVE")
                .build();

        when(cspmService.registerCloudAccount(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/cspm/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(RegisterCloudAccountRequest.builder()
                                .accountNumber("AWS-19203910")
                                .provider("AWS")
                                .accountName("Prod-Cloud")
                                .region("us-west-2")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNumber").value("AWS-19203910"))
                .andExpect(jsonPath("$.syncStatus").value("ACTIVE"));
    }

    @Test
    void remediateFinding_Success() throws Exception {
        CspmSecurityFindingResponse response = CspmSecurityFindingResponse.builder()
                .findingId("CSPM-90102")
                .status("REMEDIATED")
                .build();

        when(cspmService.remediateFinding("CSPM-90102")).thenReturn(response);

        mockMvc.perform(put("/api/auth/cspm/findings/CSPM-90102/remediate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.findingId").value("CSPM-90102"))
                .andExpect(jsonPath("$.status").value("REMEDIATED"));
    }
}
