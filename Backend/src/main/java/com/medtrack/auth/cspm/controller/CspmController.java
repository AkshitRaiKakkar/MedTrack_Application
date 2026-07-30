package com.medtrack.auth.cspm.controller;

import com.medtrack.auth.cspm.dto.*;
import com.medtrack.auth.cspm.service.CspmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Cloud Security Posture Management (CSPM) & Multi-Cloud CIS Compliance.
 */
@RestController
@RequestMapping("/api/auth/cspm")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Cloud Security Posture Management (CSPM) Subsystem", description = "APIs for AWS/Azure/GCP account registration, CIS benchmark misconfiguration scanning, and automated cloud remediation.")
public class CspmController {

    private final CspmService cspmService;

    @GetMapping("/accounts")
    @Operation(summary = "Get All Cloud Accounts", description = "Retrieves all connected AWS, Azure, and GCP accounts and sync statuses.")
    public ResponseEntity<List<CspmCloudAccountResponse>> getAllAccounts() {
        List<CspmCloudAccountResponse> accounts = cspmService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/accounts")
    @Operation(summary = "Register Cloud Account", description = "Connects a new AWS/Azure/GCP cloud account for continuous security scanning.")
    public ResponseEntity<CspmCloudAccountResponse> registerCloudAccount(@Valid @RequestBody RegisterCloudAccountRequest request) {
        CspmCloudAccountResponse response = cspmService.registerCloudAccount(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/findings")
    @Operation(summary = "Get All CSPM Findings", description = "Retrieves all open and remediated cloud misconfigurations and CIS findings.")
    public ResponseEntity<List<CspmSecurityFindingResponse>> getAllFindings() {
        List<CspmSecurityFindingResponse> findings = cspmService.getAllFindings();
        return ResponseEntity.ok(findings);
    }

    @PostMapping("/findings/ingest")
    @Operation(summary = "Ingest CSPM Finding", description = "Ingests a new cloud security finding or public bucket exposure alert.")
    public ResponseEntity<CspmSecurityFindingResponse> ingestFinding(@Valid @RequestBody IngestCspmFindingRequest request) {
        CspmSecurityFindingResponse response = cspmService.ingestFinding(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/findings/{findingId}/remediate")
    @Operation(summary = "Remediate CSPM Finding", description = "Triggers CLI/Terraform auto-remediation snippet for a cloud misconfiguration.")
    public ResponseEntity<CspmSecurityFindingResponse> remediateFinding(@PathVariable String findingId) {
        CspmSecurityFindingResponse response = cspmService.remediateFinding(findingId);
        return ResponseEntity.ok(response);
    }
}
