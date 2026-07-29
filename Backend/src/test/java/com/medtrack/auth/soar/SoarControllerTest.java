package com.medtrack.auth.soar;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.soar.controller.SoarController;
import com.medtrack.auth.soar.dto.*;
import com.medtrack.auth.soar.service.SoarService;
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
 * Controller unit tests for {@link SoarController}.
 */
@ExtendWith(MockitoExtension.class)
public class SoarControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SoarService soarService;

    @InjectMocks
    private SoarController soarController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(soarController).build();
    }

    @Test
    void createPlaybook_Success() throws Exception {
        SoarPlaybookConfigResponse response = SoarPlaybookConfigResponse.builder()
                .playbookId("SOAR-PLAY-101")
                .playbookName("Auto-Isolate-Endpoint")
                .status("ACTIVE")
                .build();

        when(soarService.createPlaybook(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/soar/playbooks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(CreateSoarPlaybookRequest.builder()
                                .playbookName("Auto-Isolate-Endpoint")
                                .triggerEvent("HIGH_SEVERITY_ALERT")
                                .targetAction("ISOLATE_HOST")
                                .autoExecutionEnabled(true)
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playbookId").value("SOAR-PLAY-101"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void triggerPlaybook_Success() throws Exception {
        SoarExecutionLogResponse response = SoarExecutionLogResponse.builder()
                .executionId("EXEC-90102")
                .status("SUCCESS")
                .affectedResource("192.168.1.100")
                .build();

        when(soarService.triggerPlaybook(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/soar/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(TriggerPlaybookExecutionRequest.builder()
                                .playbookId("SOAR-PLAY-101")
                                .triggerSource("SIEM_ALERT")
                                .affectedResource("192.168.1.100")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.executionId").value("EXEC-90102"))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }
}
