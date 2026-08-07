package com.medtrack.controller;

import com.medtrack.dto.TenderAuditLogResponse;
import com.medtrack.dto.TenderAwardRequest;
import com.medtrack.dto.TenderBidRequest;
import com.medtrack.dto.TenderBidResponse;
import com.medtrack.dto.TenderRequest;
import com.medtrack.dto.TenderResponse;
import com.medtrack.dto.TenderRoundRequest;
import com.medtrack.service.TenderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for the multi-supplier tender / e-auction workflow.
 *
 * <p>Hospitals publish requirements, run multiple bidding rounds, compare bids, and award winners;
 * invited suppliers submit and withdraw bids. The whole process is captured in an audit trail.</p>
 */
@RestController
@RequestMapping("/api/tenders")
@RequiredArgsConstructor
public class TenderController {

    private final TenderService tenderService;

    // ---- Tenders ----

    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> createTender(
            @Valid @RequestBody TenderRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tenderService.createTender(request, authentication));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<List<TenderResponse>> listTenders(Authentication authentication) {
        return ResponseEntity.ok(tenderService.listTenders(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<TenderResponse> getTender(@PathVariable Long id,
                                                    Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.getTender(id, authentication));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> publishTender(@PathVariable Long id,
                                                        Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.publishTender(id, authentication));
    }

    @PostMapping("/{id}/close-round")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> closeRound(@PathVariable Long id,
                                                     Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.closeRound(id, authentication));
    }

    @PostMapping("/{id}/open-round")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> openNextRound(
            @PathVariable Long id,
            @Valid @RequestBody TenderRoundRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.openNextRound(id, request, authentication));
    }

    @PostMapping("/{id}/award")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> awardTender(
            @PathVariable Long id,
            @Valid @RequestBody TenderAwardRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.awardTender(id, request, authentication));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<TenderResponse> cancelTender(@PathVariable Long id,
                                                       Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.cancelTender(id, authentication));
    }

    // ---- Bids ----

    @PostMapping("/{id}/bids")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<TenderBidResponse> submitBid(
            @PathVariable Long id,
            @Valid @RequestBody TenderBidRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tenderService.submitBid(id, request, authentication));
    }

    @GetMapping("/{id}/bids")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<List<TenderBidResponse>> listBids(@PathVariable Long id,
                                                            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.listBids(id, authentication));
    }

    @PostMapping("/{id}/bids/{bidId}/withdraw")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<TenderBidResponse> withdrawBid(@PathVariable Long id,
                                                         @PathVariable Long bidId,
                                                         Authentication authentication) {
        validateId(id);
        validateId(bidId);
        return ResponseEntity.ok(tenderService.withdrawBid(id, bidId, authentication));
    }

    // ---- Audit ----

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<TenderAuditLogResponse>> getAuditTrail(@PathVariable Long id,
                                                                      Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(tenderService.getAuditTrail(id, authentication));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}
