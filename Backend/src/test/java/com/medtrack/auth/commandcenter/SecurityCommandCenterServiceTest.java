package com.medtrack.auth.commandcenter;

import com.medtrack.auth.commandcenter.dto.*;
import com.medtrack.auth.commandcenter.model.*;
import com.medtrack.auth.commandcenter.repository.*;
import com.medtrack.auth.commandcenter.service.SecurityCommandCenterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SecurityCommandCenterService}.
 */
@ExtendWith(MockitoExtension.class)
public class SecurityCommandCenterServiceTest {

    @Mock
    private SecurityCommandCenterConfigRepository configRepository;

    @Mock
    private SecurityUnifiedAlertRepository alertRepository;

    private SecurityCommandCenterService commandCenterService;

    @BeforeEach
    void setUp() {
        commandCenterService = new SecurityCommandCenterService(configRepository, alertRepository);
    }

    @Test
    void getActiveConfig_Success() {
        SecurityCommandCenterConfig config = SecurityCommandCenterConfig.builder()
                .id(1L)
                .configName("DEFAULT_COMMAND_CENTER_CONFIG")
                .refreshIntervalSeconds(15)
                .activeWidgets("POSTURE_SCORE,OTEL_STREAMS")
                .riskAlertThreshold(75)
                .updatedAt(LocalDateTime.now())
                .build();

        when(configRepository.findByConfigName("DEFAULT_COMMAND_CENTER_CONFIG")).thenReturn(Optional.of(config));

        CommandCenterConfigResponse response = commandCenterService.getActiveConfig();

        assertNotNull(response);
        assertEquals(15, response.getRefreshIntervalSeconds());
        assertEquals(75, response.getRiskAlertThreshold());
    }

    @Test
    void getUnifiedSummary_Success() {
        SecurityUnifiedAlert alert = SecurityUnifiedAlert.builder()
                .alertId("ALT-901")
                .severity("CRITICAL")
                .resolutionStatus("ACTIVE")
                .build();

        when(alertRepository.findByResolutionStatus("ACTIVE")).thenReturn(List.of(alert));

        UnifiedSecuritySummaryResponse response = commandCenterService.getUnifiedSummary();

        assertNotNull(response);
        assertEquals(1, response.getActiveAlertsCount());
        assertEquals(1, response.getCriticalAlertsCount());
        assertTrue(response.getCompositePostureScore() > 0);
    }

    @Test
    void acknowledgeAlert_Success() {
        SecurityUnifiedAlert alert = SecurityUnifiedAlert.builder()
                .id(1L)
                .alertId("ALT-901")
                .resolutionStatus("ACTIVE")
                .build();

        when(alertRepository.findByAlertId("ALT-901")).thenReturn(Optional.of(alert));
        when(alertRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AcknowledgeAlertRequest request = AcknowledgeAlertRequest.builder()
                .alertId("ALT-901")
                .acknowledgedBy("SOC_OPERATOR_ALICE")
                .build();

        SecurityUnifiedAlertResponse response = commandCenterService.acknowledgeAlert(request);

        assertNotNull(response);
        assertEquals("ACKNOWLEDGED", response.getResolutionStatus());
        assertEquals("SOC_OPERATOR_ALICE", response.getAcknowledgedBy());
    }
}
