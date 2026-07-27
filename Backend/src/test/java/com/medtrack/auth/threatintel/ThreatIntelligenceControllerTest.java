package com.medtrack.auth.threatintel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.threatintel.controller.ThreatIntelligenceController;
import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.service.ThreatIntelligenceService;
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
 * Controller unit tests for {@link ThreatIntelligenceController}.
 */
@ExtendWith(MockitoExtension.class)
public class ThreatIntelligenceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ThreatIntelligenceService threatIntelService;

    @InjectMocks
    private ThreatIntelligenceController threatIntelController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(threatIntelController).build();
    }

    @Test
    void getActiveFeedConfig_Success() throws Exception {
        ThreatIntelFeedConfigResponse response = ThreatIntelFeedConfigResponse.builder()
                .feedName("STIX_TAXII_FEED")
                .providerName("ALIENVAULT_OTX")
                .autoBlockHighConfidence(true)
                .build();

        when(threatIntelService.getActiveFeedConfig()).thenReturn(response);

        mockMvc.perform(get("/api/auth/threatintel/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.feedName").value("STIX_TAXII_FEED"))
                .andExpect(jsonPath("$.providerName").value("ALIENVAULT_OTX"));
    }

    @Test
    void ingestIndicator_Success() throws Exception {
        ThreatIndicatorResponse response = ThreatIndicatorResponse.builder()
                .indicatorValue("198.51.100.45")
                .indicatorType("IP_ADDRESS")
                .status("ACTIVE")
                .build();

        when(threatIntelService.ingestIndicator(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/threatintel/ioc/ingest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(IngestIndicatorRequest.builder()
                                .indicatorValue("198.51.100.45")
                                .indicatorType("IP_ADDRESS")
                                .threatCategory("MALWARE_C2")
                                .confidenceScore(95)
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indicatorValue").value("198.51.100.45"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
