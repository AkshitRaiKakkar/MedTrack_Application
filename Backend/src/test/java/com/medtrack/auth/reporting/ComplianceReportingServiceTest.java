package com.medtrack.auth.reporting;

import com.medtrack.auth.reporting.dto.*;
import com.medtrack.auth.reporting.model.*;
import com.medtrack.auth.reporting.repository.*;
import com.medtrack.auth.reporting.service.ComplianceReportingService;
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
 * Unit tests for {@link ComplianceReportingService}.
 */
@ExtendWith(MockitoExtension.class)
public class ComplianceReportingServiceTest {

    @Mock
    private ComplianceReportConfigRepository configRepository;

    @Mock
    private ComplianceReportExportLogRepository exportLogRepository;

    private ComplianceReportingService reportingService;

    @BeforeEach
    void setUp() {
        reportingService = new ComplianceReportingService(configRepository, exportLogRepository);
    }

    @Test
    void getActiveConfig_Success() {
        ComplianceReportConfig config = ComplianceReportConfig.builder()
                .id(1L)
                .configName("MASTER_REPORT_CONFIG")
                .defaultFramework("SOC2_TYPE_2")
                .exportFormat("PDF")
                .includeAuditLogs(true)
                .includeTelemetryMetrics(true)
                .retentionPeriodDays(365)
                .updatedAt(LocalDateTime.now())
                .build();

        when(configRepository.findByConfigName("MASTER_REPORT_CONFIG")).thenReturn(Optional.of(config));

        ComplianceReportConfigResponse response = reportingService.getActiveConfig();

        assertNotNull(response);
        assertEquals("SOC2_TYPE_2", response.getDefaultFramework());
        assertEquals("PDF", response.getExportFormat());
        assertTrue(response.isIncludeAuditLogs());
    }

    @Test
    void generateComplianceReport_Success() {
        when(exportLogRepository.save(any())).thenAnswer(i -> {
            ComplianceReportExportLog log = i.getArgument(0);
            log.setId(1L);
            return log;
        });

        GenerateComplianceReportRequest request = GenerateComplianceReportRequest.builder()
                .reportTitle("Quarterly HIPAA Compliance Export")
                .framework("HIPAA_SECURITY")
                .exportFormat("CSV")
                .build();

        ComplianceReportExportLogResponse response = reportingService.generateComplianceReport(request, "COMPLIANCE_OFFICER");

        assertNotNull(response);
        assertEquals("Quarterly HIPAA Compliance Export", response.getReportTitle());
        assertEquals("HIPAA_SECURITY", response.getFramework());
        assertEquals("GENERATED", response.getGenerationStatus());
        assertNotNull(response.getSha256Checksum());
    }
}
