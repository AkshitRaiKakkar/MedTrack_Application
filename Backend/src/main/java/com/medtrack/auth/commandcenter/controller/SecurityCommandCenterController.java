package com.medtrack.auth.commandcenter.controller;

import com.medtrack.auth.commandcenter.dto.*;
import com.medtrack.auth.commandcenter.service.SecurityCommandCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Centralized Security Command Center Dashboard.
 */
@RestController
@RequestMapping("/api/auth/commandcenter")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Security Command Center Unified Dashboard", description = "APIs for unified security scorecards, cross-subsystem metrics, system-wide threat alert feeds, and dashboard widget configuration.")
public class SecurityCommandCenterController {

    private final SecurityCommandCenterService commandCenterService;

    @GetMapping("/summary")
    @Operation(summary = "Get Unified Security Summary", description = "Retrieves composite security posture score, active alerts, OTel stream counts, and sealed evidence stats.")
    public ResponseEntity<UnifiedSecuritySummaryResponse> getUnifiedSummary() {
        UnifiedSecuritySummaryResponse summary = commandCenterService.getUnifiedSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/config")
    @Operation(summary = "Get Command Center Config", description = "Retrieves active dashboard refresh rates and widget layouts.")
    public ResponseEntity<CommandCenterConfigResponse> getActiveConfig() {
        CommandCenterConfigResponse config = commandCenterService.getActiveConfig();
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    @Operation(summary = "Update Command Center Config", description = "Updates active widgets and threshold settings.")
    public ResponseEntity<CommandCenterConfigResponse> updateConfig(@Valid @RequestBody UpdateCommandCenterConfigRequest request) {
        CommandCenterConfigResponse updated = commandCenterService.updateConfig(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/alerts/acknowledge")
    @Operation(summary = "Acknowledge Unified Alert", description = "Marks a system-wide unified security alert as acknowledged.")
    public ResponseEntity<SecurityUnifiedAlertResponse> acknowledgeAlert(@Valid @RequestBody AcknowledgeAlertRequest request) {
        SecurityUnifiedAlertResponse response = commandCenterService.acknowledgeAlert(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/alerts")
    @Operation(summary = "Get All Unified Alerts", description = "Retrieves system-wide security alert feed aggregated from all security subsystems.")
    public ResponseEntity<List<SecurityUnifiedAlertResponse>> getAllAlerts() {
        List<SecurityUnifiedAlertResponse> alerts = commandCenterService.getAllAlerts();
        return ResponseEntity.ok(alerts);
    }
}
