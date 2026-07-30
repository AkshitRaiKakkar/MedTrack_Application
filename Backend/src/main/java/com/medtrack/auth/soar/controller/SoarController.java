package com.medtrack.auth.soar.controller;

import com.medtrack.auth.soar.dto.*;
import com.medtrack.auth.soar.service.SoarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Security Orchestration, Automation, and Response (SOAR).
 */
@RestController
@RequestMapping("/api/auth/soar")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "SOAR Incident Orchestration Subsystem", description = "APIs for automated incident response playbooks, trigger-action mapping, and real-time execution logs.")
public class SoarController {

    private final SoarService soarService;

    @GetMapping("/playbooks")
    @Operation(summary = "Get All SOAR Playbooks", description = "Retrieves all configured automated incident response playbooks.")
    public ResponseEntity<List<SoarPlaybookConfigResponse>> getAllPlaybooks() {
        List<SoarPlaybookConfigResponse> playbooks = soarService.getAllPlaybooks();
        return ResponseEntity.ok(playbooks);
    }

    @PostMapping("/playbooks")
    @Operation(summary = "Create SOAR Playbook", description = "Creates a new automated incident response playbook mapping trigger alerts to remediation actions.")
    public ResponseEntity<SoarPlaybookConfigResponse> createPlaybook(@Valid @RequestBody CreateSoarPlaybookRequest request) {
        SoarPlaybookConfigResponse response = soarService.createPlaybook(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/playbooks/{playbookId}/toggle")
    @Operation(summary = "Toggle Playbook Status", description = "Enables or disables an automated SOAR response playbook.")
    public ResponseEntity<SoarPlaybookConfigResponse> togglePlaybookStatus(@PathVariable String playbookId, @RequestParam boolean active) {
        SoarPlaybookConfigResponse response = soarService.togglePlaybookStatus(playbookId, active);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/execute")
    @Operation(summary = "Trigger Playbook Execution", description = "Triggers immediate execution of a SOAR incident response playbook against an affected resource.")
    public ResponseEntity<SoarExecutionLogResponse> triggerPlaybook(@Valid @RequestBody TriggerPlaybookExecutionRequest request) {
        SoarExecutionLogResponse response = soarService.triggerPlaybook(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions")
    @Operation(summary = "Get All Playbook Execution Logs", description = "Retrieves audit trail of all automated and manual SOAR playbook executions.")
    public ResponseEntity<List<SoarExecutionLogResponse>> getAllExecutionLogs() {
        List<SoarExecutionLogResponse> logs = soarService.getAllExecutionLogs();
        return ResponseEntity.ok(logs);
    }
}
