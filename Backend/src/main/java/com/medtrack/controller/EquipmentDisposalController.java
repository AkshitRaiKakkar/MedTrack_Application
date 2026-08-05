package com.medtrack.controller;

import com.medtrack.dto.DataSanitizationRequest;
import com.medtrack.dto.EquipmentDisposalRequest;
import com.medtrack.dto.EquipmentDisposalResponse;
import com.medtrack.dto.EquipmentLifecycleDecisionRequest;
import com.medtrack.model.Equipment;
import com.medtrack.service.EquipmentDisposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

/**
 * Decommissioning / disposal workflow (issue #744).
 *
 * <p>Assets are retired through a documented chain instead of being silently deleted: request,
 * manager approval, data-sanitisation confirmation for devices that stored patient or operational
 * data, completion (which moves the asset to {@code DISPOSED} and mints a certificate number) and
 * a downloadable certificate of disposal. Retired and disposed assets stay searchable in a
 * dedicated retired view.</p>
 */
@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentDisposalController {

    private final EquipmentDisposalService disposalService;

    /**
     * Retired and disposed assets for the caller's hospital - the retired view.
     * Route is declared before {@code /{id}} handlers are evaluated; Spring prefers the exact
     * literal match over the path variable.
     */
    @GetMapping("/retired")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Page<Equipment>> getRetiredEquipment(
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable,
            Principal principal) {
        return ResponseEntity.ok(disposalService.getRetiredEquipment(principal.getName(), pageable));
    }

    @PostMapping("/{id}/disposal")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> requestDisposal(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentDisposalRequest request,
            Principal principal) {
        validateId(id);
        return ResponseEntity.ok(disposalService.requestDisposal(id, request, principal.getName()));
    }

    @GetMapping("/{equipmentId}/disposals")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentDisposalResponse>> getDisposalsForEquipment(
            @PathVariable Long equipmentId,
            Principal principal) {
        validateId(equipmentId);
        return ResponseEntity.ok(disposalService.getDisposalsForEquipment(equipmentId, principal.getName()));
    }

    @GetMapping("/disposals/pending")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentDisposalResponse>> getPendingDisposals(Principal principal) {
        return ResponseEntity.ok(disposalService.getPendingDisposals(principal.getName()));
    }

    @GetMapping("/disposals/history")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentDisposalResponse>> getDisposalHistory(Principal principal) {
        return ResponseEntity.ok(disposalService.getDisposalHistory(principal.getName()));
    }

    @PostMapping("/disposals/{disposalId}/approve")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> approveDisposal(
            @PathVariable Long disposalId,
            Principal principal) {
        validateId(disposalId);
        return ResponseEntity.ok(disposalService.approveDisposal(disposalId, principal.getName()));
    }

    @PostMapping("/disposals/{disposalId}/reject")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> rejectDisposal(
            @PathVariable Long disposalId,
            @RequestBody(required = false) EquipmentLifecycleDecisionRequest request,
            Principal principal) {
        validateId(disposalId);
        return ResponseEntity.ok(disposalService.rejectDisposal(
                disposalId, request != null ? request.getReason() : null, principal.getName()));
    }

    @PostMapping("/disposals/{disposalId}/cancel")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> cancelDisposal(
            @PathVariable Long disposalId,
            Principal principal) {
        validateId(disposalId);
        return ResponseEntity.ok(disposalService.cancelDisposal(disposalId, principal.getName()));
    }

    @PostMapping("/disposals/{disposalId}/data-sanitization")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> recordDataSanitization(
            @PathVariable Long disposalId,
            @RequestBody(required = false) DataSanitizationRequest request,
            Principal principal) {
        validateId(disposalId);
        return ResponseEntity.ok(
                disposalService.recordDataSanitization(disposalId, request, principal.getName()));
    }

    @PostMapping("/disposals/{disposalId}/complete")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDisposalResponse> completeDisposal(
            @PathVariable Long disposalId,
            Principal principal) {
        validateId(disposalId);
        return ResponseEntity.ok(disposalService.completeDisposal(disposalId, principal.getName()));
    }

    @GetMapping("/disposals/{disposalId}/certificate")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<byte[]> getCertificate(
            @PathVariable Long disposalId,
            Principal principal) {
        validateId(disposalId);
        byte[] pdf = disposalService.generateCertificate(disposalId, principal.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=disposal-certificate-" + disposalId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}
