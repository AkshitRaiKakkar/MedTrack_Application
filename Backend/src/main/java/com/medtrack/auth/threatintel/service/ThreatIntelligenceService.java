package com.medtrack.auth.threatintel.service;

import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.model.*;
import com.medtrack.auth.threatintel.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing STIX/TAXII Threat Intelligence Feeds & Firewall Auto-Mitigation.
 */
@Service
@RequiredArgsConstructor
public class ThreatIntelligenceService {

    private final ThreatIntelFeedConfigRepository feedConfigRepository;
    private final ThreatIndicatorRecordRepository indicatorRepository;
    private final ThreatMitigationLogRepository mitigationLogRepository;

    private static final String DEFAULT_FEED_NAME = "STIX_TAXII_FEED";

    /**
     * Seeds baseline threat intelligence feed configuration & initial IOC findings.
     */
    @PostConstruct
    @Transactional
    public void seedThreatIntelBaseline() {
        if (feedConfigRepository.findByFeedName(DEFAULT_FEED_NAME).isEmpty()) {
            ThreatIntelFeedConfig config = ThreatIntelFeedConfig.builder()
                    .feedName(DEFAULT_FEED_NAME)
                    .providerName("ALIENVAULT_OTX")
                    .updateIntervalHours(6)
                    .minimumConfidenceScore(85)
                    .autoBlockHighConfidence(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            feedConfigRepository.save(config);
        }

        if (indicatorRepository.count() == 0) {
            seedSampleIndicator("198.51.100.45", "IP_ADDRESS", "MALWARE_C2", 95, "ACTIVE");
            seedSampleIndicator("bad-malware-domain.org", "DOMAIN_NAME", "PHISHING", 88, "ACTIVE");
            seedSampleIndicator("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "FILE_HASH", "RANSOMWARE", 99, "BLOCKED");
        }
    }

    private void seedSampleIndicator(String value, String type, String category, int score, String status) {
        if (indicatorRepository.findByIndicatorValue(value).isEmpty()) {
            indicatorRepository.save(ThreatIndicatorRecord.builder()
                    .indicatorValue(value)
                    .indicatorType(type)
                    .threatCategory(category)
                    .confidenceScore(score)
                    .status(status)
                    .discoveredAt(LocalDateTime.now().minusDays(1))
                    .mitigatedAt("BLOCKED".equalsIgnoreCase(status) ? LocalDateTime.now().minusHours(2) : null)
                    .build());
        }
    }

    /**
     * Retrieves active threat intel feed configuration.
     */
    @Transactional(readOnly = true)
    public ThreatIntelFeedConfigResponse getActiveFeedConfig() {
        ThreatIntelFeedConfig config = getOrCreateConfig();
        return mapToConfigResponse(config);
    }

    /**
     * Updates threat intel feed configuration.
     */
    @Transactional
    public ThreatIntelFeedConfigResponse updateFeedConfig(UpdateFeedConfigRequest request) {
        ThreatIntelFeedConfig config = getOrCreateConfig();
        config.setProviderName(request.getProviderName());
        config.setUpdateIntervalHours(request.getUpdateIntervalHours());
        config.setMinimumConfidenceScore(request.getMinimumConfidenceScore());
        config.setAutoBlockHighConfidence(request.isAutoBlockHighConfidence());
        config.setUpdatedAt(LocalDateTime.now());

        ThreatIntelFeedConfig updated = feedConfigRepository.save(config);
        return mapToConfigResponse(updated);
    }

    /**
     * Ingests a new Threat Indicator of Compromise (IOC).
     */
    @Transactional
    public ThreatIndicatorResponse ingestIndicator(IngestIndicatorRequest request) {
        Optional<ThreatIndicatorRecord> existing = indicatorRepository.findByIndicatorValue(request.getIndicatorValue());
        if (existing.isPresent()) {
            return mapToIndicatorResponse(existing.get());
        }

        ThreatIndicatorRecord record = ThreatIndicatorRecord.builder()
                .indicatorValue(request.getIndicatorValue())
                .indicatorType(request.getIndicatorType())
                .threatCategory(request.getThreatCategory())
                .confidenceScore(request.getConfidenceScore())
                .status("ACTIVE")
                .discoveredAt(LocalDateTime.now())
                .build();

        ThreatIndicatorRecord saved = indicatorRepository.save(record);

        // Auto-mitigation block trigger if confidence exceeds threshold
        ThreatIntelFeedConfig config = getOrCreateConfig();
        if (config.isAutoBlockHighConfidence() && request.getConfidenceScore() >= config.getMinimumConfidenceScore()) {
            executeMitigationInternal(saved, "IP_BLOCK", "AUTOMATED_WAF_ENGINE");
        }

        return mapToIndicatorResponse(saved);
    }

    /**
     * Triggers manual firewall / WAF block mitigation against a threat indicator.
     */
    @Transactional
    public ThreatMitigationLogResponse triggerMitigation(TriggerMitigationRequest request, String operator) {
        ThreatIndicatorRecord record = indicatorRepository.findByIndicatorValue(request.getIndicatorValue())
                .orElseThrow(() -> new IllegalArgumentException("Threat indicator not found for value: " + request.getIndicatorValue()));

        return executeMitigationInternal(record, request.getMitigationAction(), operator);
    }

    private ThreatMitigationLogResponse executeMitigationInternal(ThreatIndicatorRecord record, String action, String operator) {
        record.setStatus("BLOCKED");
        record.setMitigatedAt(LocalDateTime.now());
        indicatorRepository.save(record);

        String mitigationId = "MIT-" + (10000 + new Random().nextInt(90000));
        ThreatMitigationLog log = ThreatMitigationLog.builder()
                .mitigationId(mitigationId)
                .indicatorValue(record.getIndicatorValue())
                .mitigationAction(action)
                .executedBy(operator)
                .executionStatus("EXECUTED")
                .details("Automated firewall rule applied: " + action + " for IOC " + record.getIndicatorValue() + " (Confidence: " + record.getConfidenceScore() + "%)")
                .executedAt(LocalDateTime.now())
                .build();

        ThreatMitigationLog savedLog = mitigationLogRepository.save(log);
        return mapToMitigationLogResponse(savedLog);
    }

    /**
     * Retrieves all ingested threat indicators.
     */
    @Transactional(readOnly = true)
    public List<ThreatIndicatorResponse> getAllIndicators() {
        return indicatorRepository.findAll().stream()
                .map(this::mapToIndicatorResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all mitigation logs.
     */
    @Transactional(readOnly = true)
    public List<ThreatMitigationLogResponse> getAllMitigationLogs() {
        return mitigationLogRepository.findAll().stream()
                .map(this::mapToMitigationLogResponse)
                .collect(Collectors.toList());
    }

    private ThreatIntelFeedConfig getOrCreateConfig() {
        return feedConfigRepository.findByFeedName(DEFAULT_FEED_NAME)
                .orElseGet(() -> feedConfigRepository.save(ThreatIntelFeedConfig.builder()
                        .feedName(DEFAULT_FEED_NAME)
                        .providerName("ALIENVAULT_OTX")
                        .updateIntervalHours(6)
                        .minimumConfidenceScore(85)
                        .autoBlockHighConfidence(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private ThreatIntelFeedConfigResponse mapToConfigResponse(ThreatIntelFeedConfig c) {
        return ThreatIntelFeedConfigResponse.builder()
                .id(c.getId())
                .feedName(c.getFeedName())
                .providerName(c.getProviderName())
                .updateIntervalHours(c.getUpdateIntervalHours())
                .minimumConfidenceScore(c.getMinimumConfidenceScore())
                .autoBlockHighConfidence(c.isAutoBlockHighConfidence())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ThreatIndicatorResponse mapToIndicatorResponse(ThreatIndicatorRecord r) {
        return ThreatIndicatorResponse.builder()
                .id(r.getId())
                .indicatorValue(r.getIndicatorValue())
                .indicatorType(r.getIndicatorType())
                .threatCategory(r.getThreatCategory())
                .confidenceScore(r.getConfidenceScore())
                .status(r.getStatus())
                .discoveredAt(r.getDiscoveredAt())
                .mitigatedAt(r.getMitigatedAt())
                .build();
    }

    private ThreatMitigationLogResponse mapToMitigationLogResponse(ThreatMitigationLog l) {
        return ThreatMitigationLogResponse.builder()
                .id(l.getId())
                .mitigationId(l.getMitigationId())
                .indicatorValue(l.getIndicatorValue())
                .mitigationAction(l.getMitigationAction())
                .executedBy(l.getExecutedBy())
                .executionStatus(l.getExecutionStatus())
                .details(l.getDetails())
                .executedAt(l.getExecutedAt())
                .build();
    }
}
