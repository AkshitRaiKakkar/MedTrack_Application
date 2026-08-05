package com.medtrack.controller;

import com.medtrack.dto.MaintenanceRuleRequest;
import com.medtrack.dto.MaintenanceRuleResponse;
import com.medtrack.dto.RulePreviewResponse;
import com.medtrack.dto.SlaSummaryResponse;
import com.medtrack.dto.TechnicianWorkloadResponse;
import com.medtrack.model.MaintenanceGenerationRun;
import com.medtrack.service.PreventiveMaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for the preventive-maintenance automation subsystem.
 *
 * <p>Hospitals manage recurrence rules, preview and trigger generation, and view the SLA and
 * workload dashboards. Every operation is scoped to the authenticated hospital.</p>
 */
@RestController
@RequestMapping("/api/maintenance/automation")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PreventiveMaintenanceController {

    private final PreventiveMaintenanceService preventiveMaintenanceService;

    // ---- Rule CRUD ----

    @GetMapping("/rules")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<MaintenanceRuleResponse>> listRules(Authentication authentication) {
        return ResponseEntity.ok(preventiveMaintenanceService.listRules(authentication));
    }

    @GetMapping("/rules/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceRuleResponse> getRule(@PathVariable Long id, Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(preventiveMaintenanceService.getRule(id, authentication));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceRuleResponse> createRule(
            @Valid @RequestBody MaintenanceRuleRequest request, Authentication authentication) {
        MaintenanceRuleResponse created = preventiveMaintenanceService.createRule(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceRuleResponse> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRuleRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(preventiveMaintenanceService.updateRule(id, request, authentication));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id, Authentication authentication) {
        validateId(id);
        preventiveMaintenanceService.deleteRule(id, authentication);
        return ResponseEntity.noContent().build();
    }

    // ---- Generation ----

    @GetMapping("/rules/{id}/preview")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<RulePreviewResponse> previewRule(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate windowStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate windowEnd,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(preventiveMaintenanceService.previewRule(id, windowStart, windowEnd, authentication));
    }

    @PostMapping("/rules/{id}/generate")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceGenerationRun> generateTasks(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate windowStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate windowEnd,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(preventiveMaintenanceService.generateTasks(id, windowStart, windowEnd, authentication));
    }

    // ---- SLA + workload ----

    @GetMapping("/sla")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SlaSummaryResponse> getSlaSummary(Authentication authentication) {
        return ResponseEntity.ok(preventiveMaintenanceService.getSlaSummary(authentication));
    }

    @PostMapping("/sla/refresh")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SlaSummaryResponse> refreshSla(Authentication authentication) {
        return ResponseEntity.ok(preventiveMaintenanceService.refreshSla(authentication));
    }

    @GetMapping("/workload")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TechnicianWorkloadResponse> getTechnicianWorkload(Authentication authentication) {
        return ResponseEntity.ok(preventiveMaintenanceService.getTechnicianWorkload(authentication));
    }

    /**
     * Validates that a resource ID is a positive number.
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}
