package com.medtrack.auth.pam.controller;

import com.medtrack.auth.pam.dto.*;
import com.medtrack.auth.pam.service.PamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Privileged Access Management (PAM) & Just-In-Time (JIT) Credential Elevation.
 */
@RestController
@RequestMapping("/api/auth/pam")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Privileged Access Management (PAM) Subsystem", description = "APIs for JIT credential elevation requests, auto-approval rules, session timeouts, and command execution audit logging.")
public class PamController {

    private final PamService pamService;

    @GetMapping("/policy")
    @Operation(summary = "Get PAM Policy", description = "Retrieves active PAM elevation rules, timeout bounds, and MFA requirements.")
    public ResponseEntity<PamPolicyConfigResponse> getActivePolicy() {
        PamPolicyConfigResponse policy = pamService.getActivePolicy();
        return ResponseEntity.ok(policy);
    }

    @PutMapping("/policy")
    @Operation(summary = "Update PAM Policy", description = "Updates max session minutes, auto-approval rules, and ticket enforcement.")
    public ResponseEntity<PamPolicyConfigResponse> updatePolicy(@Valid @RequestBody UpdatePamPolicyRequest request) {
        PamPolicyConfigResponse updated = pamService.updatePolicy(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/request")
    @Operation(summary = "Submit JIT Access Request", description = "Submits a Just-In-Time privileged access elevation request for target resource.")
    public ResponseEntity<PamAccessRequestResponse> createAccessRequest(@Valid @RequestBody CreatePamAccessRequest request) {
        PamAccessRequestResponse response = pamService.createAccessRequest(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/request/{requestId}/approve")
    @Operation(summary = "Approve JIT Access Request", description = "Approves a pending JIT elevation request and activates session expiration timer.")
    public ResponseEntity<PamAccessRequestResponse> approveRequest(@PathVariable String requestId) {
        PamAccessRequestResponse response = pamService.approveRequest(requestId, "CHIEF_SECURITY_OFFICER");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session/log")
    @Operation(summary = "Record Session Command Log", description = "Logs command execution / SQL statement during an elevated PAM session.")
    public ResponseEntity<PamSessionAuditLogResponse> recordSessionLog(@Valid @RequestBody RecordPamSessionLogRequest request) {
        PamSessionAuditLogResponse response = pamService.recordSessionLog(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests")
    @Operation(summary = "Get All JIT Access Requests", description = "Retrieves all active, pending, and historical JIT elevation requests.")
    public ResponseEntity<List<PamAccessRequestResponse>> getAllRequests() {
        List<PamAccessRequestResponse> requests = pamService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/session/logs")
    @Operation(summary = "Get All PAM Session Command Logs", description = "Retrieves audit log of all commands executed in privileged sessions.")
    public ResponseEntity<List<PamSessionAuditLogResponse>> getAllSessionLogs() {
        List<PamSessionAuditLogResponse> logs = pamService.getAllSessionLogs();
        return ResponseEntity.ok(logs);
    }
}
