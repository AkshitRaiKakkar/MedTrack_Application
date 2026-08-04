package com.medtrack.auth.threatintel.controller;

import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.service.ThreatIntelligenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for STIX/TAXII Threat Intelligence & Firewall Auto-Mitigation.
 */
@RestController
@RequestMapping("/api/auth/threatintel")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Threat Intelligence STIX/TAXII Subsystem", description = "APIs for threat feed ingestion, IOC confidence matrix, auto-block firewall triggers, and mitigation audit logs.")
public class ThreatIntelligenceController {

    private final ThreatIntelligenceService threatIntelService;

    @GetMapping("/config")
    @Operation(summary = "Get Feed Config", description = "Retrieves active threat intelligence feed provider and auto-block confidence threshold.")
    public ResponseEntity<ThreatIntelFeedConfigResponse> getActiveFeedConfig() {
        ThreatIntelFeedConfigResponse config = threatIntelService.getActiveFeedConfig();
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    @Operation(summary = "Update Feed Config", description = "Updates provider name, sync interval, and auto-mitigation thresholds.")
    public ResponseEntity<ThreatIntelFeedConfigResponse> updateFeedConfig(@Valid @RequestBody UpdateFeedConfigRequest request) {
        ThreatIntelFeedConfigResponse updated = threatIntelService.updateFeedConfig(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/ioc/ingest")
    @Operation(summary = "Ingest Threat Indicator", description = "Ingests an IOC finding (IP/Domain/FileHash) and triggers auto-mitigation if confidence threshold is exceeded.")
    public ResponseEntity<ThreatIndicatorResponse> ingestIndicator(@Valid @RequestBody IngestIndicatorRequest request) {
        ThreatIndicatorResponse response = threatIntelService.ingestIndicator(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mitigate/trigger")
    @Operation(summary = "Trigger Firewall Mitigation", description = "Executes automated firewall/WAF block action against a target threat indicator.")
    public ResponseEntity<ThreatMitigationLogResponse> triggerMitigation(@Valid @RequestBody TriggerMitigationRequest request) {
        ThreatMitigationLogResponse response = threatIntelService.triggerMitigation(request, "SECURITY_OPERATOR");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ioc")
    @Operation(summary = "Get All Indicators", description = "Retrieves list of all ingested IOC threat indicators.")
    public ResponseEntity<List<ThreatIndicatorResponse>> getAllIndicators() {
        List<ThreatIndicatorResponse> indicators = threatIntelService.getAllIndicators();
        return ResponseEntity.ok(indicators);
    }

    @GetMapping("/mitigate/logs")
    @Operation(summary = "Get Mitigation Logs", description = "Retrieves execution history of firewall/WAF mitigation blocks.")
    public ResponseEntity<List<ThreatMitigationLogResponse>> getAllMitigationLogs() {
        List<ThreatMitigationLogResponse> logs = threatIntelService.getAllMitigationLogs();
        return ResponseEntity.ok(logs);
    }
}
