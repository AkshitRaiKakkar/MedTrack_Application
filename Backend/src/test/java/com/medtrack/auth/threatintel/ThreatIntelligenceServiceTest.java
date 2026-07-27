package com.medtrack.auth.threatintel;

import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.model.*;
import com.medtrack.auth.threatintel.repository.*;
import com.medtrack.auth.threatintel.service.ThreatIntelligenceService;
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
 * Unit tests for {@link ThreatIntelligenceService}.
 */
@ExtendWith(MockitoExtension.class)
public class ThreatIntelligenceServiceTest {

    @Mock
    private ThreatIntelFeedConfigRepository feedConfigRepository;

    @Mock
    private ThreatIndicatorRecordRepository indicatorRepository;

    @Mock
    private ThreatMitigationLogRepository mitigationLogRepository;

    private ThreatIntelligenceService threatIntelService;

    @BeforeEach
    void setUp() {
        threatIntelService = new ThreatIntelligenceService(feedConfigRepository, indicatorRepository, mitigationLogRepository);
    }

    @Test
    void getActiveFeedConfig_Success() {
        ThreatIntelFeedConfig config = ThreatIntelFeedConfig.builder()
                .id(1L)
                .feedName("STIX_TAXII_FEED")
                .providerName("ALIENVAULT_OTX")
                .updateIntervalHours(6)
                .minimumConfidenceScore(85)
                .autoBlockHighConfidence(true)
                .updatedAt(LocalDateTime.now())
                .build();

        when(feedConfigRepository.findByFeedName("STIX_TAXII_FEED")).thenReturn(Optional.of(config));

        ThreatIntelFeedConfigResponse response = threatIntelService.getActiveFeedConfig();

        assertNotNull(response);
        assertEquals("ALIENVAULT_OTX", response.getProviderName());
        assertTrue(response.isAutoBlockHighConfidence());
    }

    @Test
    void ingestIndicator_Success() {
        when(indicatorRepository.findByIndicatorValue("203.0.113.19")).thenReturn(Optional.empty());
        when(indicatorRepository.save(any())).thenAnswer(i -> {
            ThreatIndicatorRecord r = i.getArgument(0);
            r.setId(1L);
            return r;
        });

        IngestIndicatorRequest request = IngestIndicatorRequest.builder()
                .indicatorValue("203.0.113.19")
                .indicatorType("IP_ADDRESS")
                .threatCategory("MALWARE_C2")
                .confidenceScore(92)
                .build();

        ThreatIndicatorResponse response = threatIntelService.ingestIndicator(request);

        assertNotNull(response);
        assertEquals("203.0.113.19", response.getIndicatorValue());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void triggerMitigation_Success() {
        ThreatIndicatorRecord record = ThreatIndicatorRecord.builder()
                .id(1L)
                .indicatorValue("198.51.100.45")
                .status("ACTIVE")
                .confidenceScore(95)
                .build();

        when(indicatorRepository.findByIndicatorValue("198.51.100.45")).thenReturn(Optional.of(record));
        when(mitigationLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TriggerMitigationRequest request = TriggerMitigationRequest.builder()
                .indicatorValue("198.51.100.45")
                .mitigationAction("IP_BLOCK")
                .build();

        ThreatMitigationLogResponse response = threatIntelService.triggerMitigation(request, "SOC_OPERATOR");

        assertNotNull(response);
        assertEquals("EXECUTED", response.getExecutionStatus());
        assertEquals("198.51.100.45", response.getIndicatorValue());
        assertEquals("BLOCKED", record.getStatus());
    }
}
