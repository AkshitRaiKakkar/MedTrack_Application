package com.medtrack.controller;

import com.medtrack.dto.ApprovalDecisionRequest;
import com.medtrack.dto.ApprovalPolicyRequest;
import com.medtrack.dto.ApprovalPolicyResponse;
import com.medtrack.dto.ApprovalPolicyStepRequest;
import com.medtrack.dto.ApprovalStepResponse;
import com.medtrack.dto.BudgetSummaryResponse;
import com.medtrack.dto.InvoiceMatchRequest;
import com.medtrack.dto.InvoiceMatchResponse;
import com.medtrack.dto.ProcurementAuditLogResponse;
import com.medtrack.dto.ProcurementRequestRequest;
import com.medtrack.dto.ProcurementRequestResponse;
import com.medtrack.dto.ReceivingRecordRequest;
import com.medtrack.dto.ReceivingRecordResponse;
import com.medtrack.dto.SupplierQuoteRequest;
import com.medtrack.dto.SupplierQuoteResponse;
import com.medtrack.model.ProcurementRequestStatus;
import com.medtrack.service.ProcurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for the procurement approvals and receiving reconciliation workflow.
 *
 * <p>Hospitals create requests, configure approval policies, decide on approval steps, accept
 * quotes, record receiving, and reconcile invoices. Suppliers submit and track quotes.</p>
 */
@RestController
@RequestMapping("/api/procurement")
@RequiredArgsConstructor
public class ProcurementController {

    private final ProcurementService procurementService;

    // ---- Requests ----

    @PostMapping("/requests")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ProcurementRequestResponse> createRequest(
            @Valid @RequestBody ProcurementRequestRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.createRequest(request, authentication));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<ProcurementRequestResponse>> listRequests(
            @RequestParam(required = false) ProcurementRequestStatus status,
            Authentication authentication) {
        if (status != null) {
            return ResponseEntity.ok(procurementService.listRequestsByStatus(status, authentication));
        }
        return ResponseEntity.ok(procurementService.listRequests(authentication));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ProcurementRequestResponse> getRequest(@PathVariable Long id,
                                                                 Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.getRequest(id, authentication));
    }

    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ProcurementRequestResponse> cancelRequest(@PathVariable Long id,
                                                                    Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.cancelRequest(id, authentication));
    }

    // ---- Approval steps ----

    @PostMapping("/steps/{stepId}/decision")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ProcurementRequestResponse> decideStep(
            @PathVariable Long stepId,
            @Valid @RequestBody ApprovalDecisionRequest decision,
            Authentication authentication) {
        validateId(stepId);
        return ResponseEntity.ok(procurementService.approveStep(stepId, decision, authentication));
    }

    @GetMapping("/approval-inbox")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<ApprovalStepResponse>> getApprovalInbox(Authentication authentication) {
        return ResponseEntity.ok(procurementService.getApprovalInbox(authentication));
    }

    // ---- Approval policies ----

    @GetMapping("/policies")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<ApprovalPolicyResponse>> listPolicies(Authentication authentication) {
        return ResponseEntity.ok(procurementService.listPolicies(authentication));
    }

    @PostMapping("/policies")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApprovalPolicyResponse> createPolicy(
            @Valid @RequestBody ApprovalPolicyRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.createPolicy(request, authentication));
    }

    @PutMapping("/policies/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApprovalPolicyResponse> updatePolicy(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalPolicyRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.updatePolicy(id, request, authentication));
    }

    @PostMapping("/policies/{id}/steps")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApprovalPolicyResponse> addPolicyStep(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalPolicyStepRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.addPolicyStep(id, request, authentication));
    }

    @DeleteMapping("/policies/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> removePolicyStep(
            @PathVariable Long id,
            @PathVariable Long stepId,
            Authentication authentication) {
        validateId(id);
        validateId(stepId);
        procurementService.removePolicyStep(id, stepId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/policies/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deletePolicy(@PathVariable Long id, Authentication authentication) {
        validateId(id);
        procurementService.deletePolicy(id, authentication);
        return ResponseEntity.noContent().build();
    }

    // ---- Quotes ----

    @PostMapping("/requests/{id}/quotes")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<SupplierQuoteResponse> submitQuote(
            @PathVariable Long id,
            @Valid @RequestBody SupplierQuoteRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.submitQuote(id, request, authentication));
    }

    @GetMapping("/requests/{id}/quotes")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<List<SupplierQuoteResponse>> listQuotes(
            @PathVariable Long id,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.listQuotesForRequest(id, authentication));
    }

    @GetMapping("/quotes/mine")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<List<SupplierQuoteResponse>> listMyQuotes(Authentication authentication) {
        return ResponseEntity.ok(procurementService.listMyQuotes(authentication));
    }

    @PostMapping("/requests/{id}/quotes/{quoteId}/accept")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ProcurementRequestResponse> acceptQuote(
            @PathVariable Long id,
            @PathVariable Long quoteId,
            Authentication authentication) {
        validateId(id);
        validateId(quoteId);
        return ResponseEntity.ok(procurementService.acceptQuote(id, quoteId, authentication));
    }

    // ---- Receiving ----

    @PostMapping("/requests/{id}/receiving")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ReceivingRecordResponse> recordReceiving(
            @PathVariable Long id,
            @Valid @RequestBody ReceivingRecordRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.recordReceiving(id, request, authentication));
    }

    @GetMapping("/requests/{id}/receiving")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<ReceivingRecordResponse>> listReceiving(
            @PathVariable Long id,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.listReceiving(id, authentication));
    }

    // ---- Invoice matching ----

    @PostMapping("/requests/{id}/invoice-match")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<InvoiceMatchResponse> recordInvoiceMatch(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceMatchRequest request,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.recordInvoiceMatch(id, request, authentication));
    }

    @GetMapping("/requests/{id}/invoice-match")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<InvoiceMatchResponse>> listInvoiceMatches(
            @PathVariable Long id,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.listInvoiceMatches(id, authentication));
    }

    // ---- Audit + budget ----

    @GetMapping("/requests/{id}/audit")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<ProcurementAuditLogResponse>> getAuditTrail(
            @PathVariable Long id,
            Authentication authentication) {
        validateId(id);
        return ResponseEntity.ok(procurementService.getAuditTrail(id, authentication));
    }

    @GetMapping("/budget")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<BudgetSummaryResponse> getBudgetSummary(Authentication authentication) {
        return ResponseEntity.ok(procurementService.getBudgetSummary(authentication));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}
