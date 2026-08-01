package com.medtrack.auth.reporting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.reporting.controller.ComplianceReportingController;
import com.medtrack.auth.reporting.dto.*;
import com.medtrack.auth.reporting.service.ComplianceReportingService;
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
 * Controller unit tests for {@link ComplianceReportingController}.
 */
@ExtendWith(MockitoExtension.class)
public class ComplianceReportingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ComplianceReportingService reportingService;

    @InjectMocks
    private ComplianceReportingController reportingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportingController).build();
    }

    @Test
    void getActiveConfig_Success() throws Exception {
        ComplianceReportConfigResponse response = ComplianceReportConfigResponse.builder()
                .configName("MASTER_REPORT_CONFIG")
                .defaultFramework("SOC2_TYPE_2")
                .exportFormat("PDF")
                .includeAuditLogs(true)
                .build();

        when(reportingService.getActiveConfig()).thenReturn(response);

        mockMvc.perform(get("/api/auth/reporting/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configName").value("MASTER_REPORT_CONFIG"))
                .andExpect(jsonPath("$.defaultFramework").value("SOC2_TYPE_2"));
    }

    @Test
    void generateComplianceReport_Success() throws Exception {
        ComplianceReportExportLogResponse response = ComplianceReportExportLogResponse.builder()
                .reportId("RPT-99102")
                .reportTitle("ISO 27001 Audit Report")
                .framework("ISO_27001")
                .generationStatus("GENERATED")
                .build();

        when(reportingService.generateComplianceReport(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/reporting/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(GenerateComplianceReportRequest.builder()
                                .reportTitle("ISO 27001 Audit Report")
                                .framework("ISO_27001")
                                .exportFormat("PDF")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value("RPT-99102"))
                .andExpect(jsonPath("$.generationStatus").value("GENERATED"));
    }
}
