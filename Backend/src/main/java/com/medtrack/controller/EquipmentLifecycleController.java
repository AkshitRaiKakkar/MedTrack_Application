package com.medtrack.controller;

import com.medtrack.dto.EquipmentDepreciationSummaryResponse;
import com.medtrack.dto.EquipmentLifecycleActionRequest;
import com.medtrack.dto.EquipmentLifecycleActionResponse;
import com.medtrack.dto.EquipmentLifecycleDecisionRequest;
import com.medtrack.dto.EquipmentLocationResponse;
import com.medtrack.service.EquipmentLifecycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentLifecycleController {

    private final EquipmentLifecycleService lifecycleService;

    @GetMapping("/{id}/lifecycle")
    public ResponseEntity<List<EquipmentLifecycleActionResponse>> getTimeline(
            @PathVariable Long id,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(lifecycleService.getTimeline(id, principal.getName()));
    }

    @PostMapping("/{id}/lifecycle")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentLifecycleActionResponse> createAction(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentLifecycleActionRequest request,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(lifecycleService.createAction(id, request, principal.getName()));
    }

    @GetMapping("/{id}/lifecycle/location")
    public ResponseEntity<EquipmentLocationResponse> getCurrentLocation(
            @PathVariable Long id,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(lifecycleService.getCurrentLocation(id, principal.getName()));
    }

    @GetMapping("/{id}/lifecycle/depreciation")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDepreciationSummaryResponse> getDepreciationSummary(
            @PathVariable Long id,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(lifecycleService.getDepreciationSummary(id, principal.getName()));
    }

    @GetMapping("/{id}/lifecycle/replacement-chain")
    public ResponseEntity<List<EquipmentLifecycleActionResponse>> getReplacementChain(
            @PathVariable Long id,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(lifecycleService.getReplacementChain(id, principal.getName()));
    }

    @GetMapping("/lifecycle/pending")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentLifecycleActionResponse>> getPendingActions(Principal principal) {
        return ResponseEntity.ok(lifecycleService.getPendingActions(principal.getName()));
    }

    @PostMapping("/lifecycle/{actionId}/approve")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentLifecycleActionResponse> approveAction(
            @PathVariable Long actionId,
            Principal principal) {
        validateId(actionId);
        return ResponseEntity.ok(lifecycleService.approveAction(actionId, principal.getName()));
    }

    @PostMapping("/lifecycle/{actionId}/reject")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentLifecycleActionResponse> rejectAction(
            @PathVariable Long actionId,
            @RequestBody(required = false) EquipmentLifecycleDecisionRequest request,
            Principal principal) {
        validateId(actionId);
        return ResponseEntity.ok(lifecycleService.rejectAction(
                actionId, request != null ? request.getReason() : null, principal.getName()));
    }

    @PostMapping("/lifecycle/{actionId}/cancel")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentLifecycleActionResponse> cancelAction(
            @PathVariable Long actionId,
            Principal principal) {
        validateId(actionId);
        return ResponseEntity.ok(lifecycleService.cancelAction(actionId, principal.getName()));
    }

    @PostMapping("/lifecycle/{actionId}/complete")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentLifecycleActionResponse> completeAction(
            @PathVariable Long actionId,
            Principal principal) {
        validateId(actionId);
        return ResponseEntity.ok(lifecycleService.completeAction(actionId, principal.getName()));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}
