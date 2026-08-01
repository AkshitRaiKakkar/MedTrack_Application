package com.medtrack.auth.reporting.controller;

import com.medtrack.auth.reporting.dto.*;
import com.medtrack.auth.reporting.service.ComplianceReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Enterprise Compliance Reporting & Executive Audit Exports.
 */
@RestController
@RequestMapping("/api/auth/reporting")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Compliance Reporting Subsystem", description = "APIs for generating SOC2/HIPAA/ISO compliance reports, SHA-256 evidence attestation, and export history.")
public class ComplianceReportingController {

    private final ComplianceReportingService reportingService;

    @GetMapping("/config")
    @Operation(summary = "Get Reporting Config", description = "Retrieves current default compliance framework and export template configuration.")
    public ResponseEntity<ComplianceReportConfigResponse> getActiveConfig() {
        ComplianceReportConfigResponse config = reportingService.getActiveConfig();
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    @Operation(summary = "Update Reporting Config", description = "Updates default framework, export format, retention rules, and audit log inclusion policy.")
    public ResponseEntity<ComplianceReportConfigResponse> updateConfig(@Valid @RequestBody UpdateReportConfigRequest request) {
        ComplianceReportConfigResponse updated = reportingService.updateConfig(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate Executive Compliance Report", description = "Generates a certified executive compliance report export with SHA-256 verification hash.")
    public ResponseEntity<ComplianceReportExportLogResponse> generateComplianceReport(@Valid @RequestBody GenerateComplianceReportRequest request) {
        ComplianceReportExportLogResponse response = reportingService.generateComplianceReport(request, "CHIEF_COMPLIANCE_OFFICER");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exports")
    @Operation(summary = "Get All Compliance Report Exports", description = "Retrieves historical audit log of generated compliance export bundles.")
    public ResponseEntity<List<ComplianceReportExportLogResponse>> getAllReportLogs() {
        List<ComplianceReportExportLogResponse> logs = reportingService.getAllReportLogs();
        return ResponseEntity.ok(logs);
    }
}
