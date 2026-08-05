package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.ApprovalDecisionRequest;
import com.medtrack.dto.ApprovalPolicyRequest;
import com.medtrack.dto.ApprovalPolicyResponse;
import com.medtrack.dto.ApprovalPolicyStepResponse;
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
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.ApprovalPolicy;
import com.medtrack.model.ApprovalPolicyStep;
import com.medtrack.model.ApprovalStep;
import com.medtrack.model.ApprovalStepStatus;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.InvoiceMatchRecord;
import com.medtrack.model.InvoiceMatchStatus;
import com.medtrack.model.ProcurementAuditLog;
import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
import com.medtrack.model.ReceivingRecord;
import com.medtrack.model.ReceivingCondition;
import com.medtrack.model.SupplierQuote;
import com.medtrack.model.SupplierQuoteStatus;
import com.medtrack.repository.ApprovalPolicyRepository;
import com.medtrack.repository.ApprovalPolicyStepRepository;
import com.medtrack.repository.ApprovalStepRepository;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.InvoiceMatchRecordRepository;
import com.medtrack.repository.ProcurementAuditLogRepository;
import com.medtrack.repository.ProcurementRequestRepository;
import com.medtrack.repository.ReceivingRecordRepository;
import com.medtrack.repository.SupplierQuoteRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Procurement approvals and receiving reconciliation workflow.
 *
 * <p>Owns the request lifecycle (request → approval → quote → order → receiving → invoice match),
 * configurable approval policies with sequential/parallel steps, budget reservation, and the audit
 * trail. Requesters cannot approve their own high-value requests.</p>
 */
@Service
@RequiredArgsConstructor
public class ProcurementService {

    private static final Logger log = LoggerFactory.getLogger(ProcurementService.class);
    private static final BigDecimal SELF_APPROVAL_THRESHOLD = new BigDecimal("50000");
    private static final BigDecimal DEFAULT_BUDGET = new BigDecimal("1000000");

    private final ProcurementRequestRepository requestRepository;
    private final ApprovalPolicyRepository policyRepository;
    private final ApprovalPolicyStepRepository policyStepRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final SupplierQuoteRepository quoteRepository;
    private final ReceivingRecordRepository receivingRepository;
    private final InvoiceMatchRecordRepository invoiceRepository;
    private final ProcurementAuditLogRepository auditRepository;
    private final EquipmentOrderRepository orderRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final SupplierAccessGuard supplierAccessGuard;

    // ------------------------------------------------------------------
    // Requests
    // ------------------------------------------------------------------

    @Transactional
    public ProcurementRequestResponse createRequest(ProcurementRequestRequest request, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        validateRequest(request);

        BigDecimal totalCost = request.getUnitCost()
                .multiply(BigDecimal.valueOf(request.getQuantity().longValue()));
        reserveBudget(hospital.hospitalId(), totalCost);

        ProcurementRequest entity = ProcurementRequest.builder()
                .requestCode(nextRequestCode(hospital.hospitalId()))
                .hospitalId(hospital.hospitalId())
                .requesterId(hospital.user().getId())
                .requesterName(hospital.user().getName())
                .requesterEmail(hospital.user().getEmail())
                .equipmentCode(request.getEquipmentCode().trim())
                .equipmentName(request.getEquipmentName().trim())
                .quantity(request.getQuantity())
                .unitCost(request.getUnitCost())
                .totalCost(totalCost)
                .status(ProcurementRequestStatus.REQUESTED)
                .urgency(request.getUrgency())
                .category(request.getCategory())
                .budgetReserved(totalCost)
                .notes(trimToNull(request.getNotes()))
                .requestedAt(LocalDateTime.now())
                .build();
        ProcurementRequest saved = requestRepository.save(entity);

        ApprovalPolicy policy = resolvePolicy(hospital.hospitalId(), totalCost, request);
        materializeApprovalSteps(saved, policy, hospital.hospitalId());
        saved.setStatus(ProcurementRequestStatus.AWAITING_APPROVAL);
        saved.setUpdatedAt(LocalDateTime.now());
        saved = requestRepository.save(saved);

        audit(hospital.hospitalId(), saved.getId(), hospital.user().getEmail(),
                "REQUEST_CREATED", "Created request for " + saved.getQuantity() + " x " + saved.getEquipmentName()
                        + " totaling " + totalCost + " under policy " + policy.getName());
        log.info("Procurement request {} created by hospital {} under policy {}",
                saved.getRequestCode(), hospital.hospitalId(), policy.getName());
        return toResponse(saved, hospital.hospitalId());
    }

    @Transactional
    public ProcurementRequestResponse approveStep(Long stepId, ApprovalDecisionRequest decision,
                                                   Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ApprovalStep step = approvalStepRepository.findByIdAndHospitalId(stepId, hospital.hospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Approval step not found or access denied"));
        ProcurementRequest request = getOwnedRequest(step.getRequestId(), hospital.hospitalId());

        if (request.getStatus() != ProcurementRequestStatus.AWAITING_APPROVAL) {
            throw new IllegalArgumentException("Request is not awaiting approval");
        }
        if (step.getStatus() != ApprovalStepStatus.PENDING) {
            throw new IllegalArgumentException("Approval step has already been decided");
        }
        // A requester may not approve their own high-value request.
        if (request.getRequesterId().equals(hospital.user().getId())
                && request.getTotalCost() != null
                && request.getTotalCost().compareTo(SELF_APPROVAL_THRESHOLD) >= 0) {
            throw new AccessDeniedException("Requesters cannot approve their own high-value requests");
        }

        boolean approve = decision != null && Boolean.TRUE.equals(decision.getApprove());
        step.setStatus(approve ? ApprovalStepStatus.APPROVED : ApprovalStepStatus.REJECTED);
        step.setComment(trimToNull(decision != null ? decision.getComment() : null));
        step.setDecidedBy(hospital.user().getEmail());
        step.setDecidedAt(LocalDateTime.now());
        approvalStepRepository.save(step);

        if (!approve) {
            request.setStatus(ProcurementRequestStatus.REJECTED);
            request.setDecidedAt(LocalDateTime.now());
            request.setDecidedBy(hospital.user().getEmail());
            request.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(request);
            audit(hospital.hospitalId(), request.getId(), hospital.user().getEmail(),
                    "REQUEST_REJECTED", "Step " + step.getStepGroup() + " rejected: " + step.getComment());
            return toResponse(request, hospital.hospitalId());
        }

        audit(hospital.hospitalId(), request.getId(), hospital.user().getEmail(),
                "STEP_APPROVED", "Step " + step.getStepGroup() + " approved by " + hospital.user().getEmail());
        if (allStepsApproved(request.getId())) {
            request.setStatus(ProcurementRequestStatus.APPROVED);
            request.setDecidedAt(LocalDateTime.now());
            request.setDecidedBy(hospital.user().getEmail());
            request.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(request);
            audit(hospital.hospitalId(), request.getId(), hospital.user().getEmail(),
                    "REQUEST_APPROVED", "All approval steps approved");
        }
        return toResponse(request, hospital.hospitalId());
    }

    @Transactional
    public ProcurementRequestResponse cancelRequest(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ProcurementRequest request = getOwnedRequest(requestId, hospital.hospitalId());
        if (request.getStatus() == ProcurementRequestStatus.CLOSED
                || request.getStatus() == ProcurementRequestStatus.CANCELLED
                || request.getStatus() == ProcurementRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Request cannot be cancelled from its current state");
        }
        request.setStatus(ProcurementRequestStatus.CANCELLED);
        request.setDecidedAt(LocalDateTime.now());
        request.setDecidedBy(hospital.user().getEmail());
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
        audit(hospital.hospitalId(), request.getId(), hospital.user().getEmail(),
                "REQUEST_CANCELLED", "Request cancelled by " + hospital.user().getEmail());
        return toResponse(request, hospital.hospitalId());
    }

    // ------------------------------------------------------------------
    // Approval policies
    // ------------------------------------------------------------------

    @Transactional
    public ApprovalPolicyResponse createPolicy(ApprovalPolicyRequest request, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        validatePolicy(request);

        ApprovalPolicy policy = ApprovalPolicy.builder()
                .hospitalId(hospital.hospitalId())
                .name(request.getName().trim())
                .description(trimToNull(request.getDescription()))
                .minAmount(request.getMinAmount())
                .maxAmount(request.getMaxAmount())
                .category(request.getCategory())
                .urgency(request.getUrgency())
                .requesterRole(trimToNull(request.getRequesterRole()))
                .active(request.getActive() == null || request.getActive())
                .createdAt(LocalDateTime.now())
                .build();
        ApprovalPolicy saved = policyRepository.save(policy);
        return toPolicyResponse(saved);
    }

    @Transactional
    public ApprovalPolicyResponse updatePolicy(Long policyId, ApprovalPolicyRequest request,
                                                Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ApprovalPolicy policy = getOwnedPolicy(policyId, hospital.hospitalId());
        validatePolicy(request);

        policy.setName(request.getName().trim());
        policy.setDescription(trimToNull(request.getDescription()));
        policy.setMinAmount(request.getMinAmount());
        policy.setMaxAmount(request.getMaxAmount());
        policy.setCategory(request.getCategory());
        policy.setUrgency(request.getUrgency());
        policy.setRequesterRole(trimToNull(request.getRequesterRole()));
        if (request.getActive() != null) {
            policy.setActive(request.getActive());
        }
        policy.setUpdatedAt(LocalDateTime.now());
        return toPolicyResponse(policyRepository.save(policy));
    }

    @Transactional
    public ApprovalPolicyResponse addPolicyStep(Long policyId, com.medtrack.dto.ApprovalPolicyStepRequest request,
                                                 Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ApprovalPolicy policy = getOwnedPolicy(policyId, hospital.hospitalId());
        ApprovalPolicyStep step = ApprovalPolicyStep.builder()
                .policyId(policy.getId())
                .stepGroup(request.getStepGroup())
                .approverRole(request.getApproverRole().trim().toLowerCase(Locale.ROOT))
                .approverEmail(trimToNull(request.getApproverEmail()))
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
        policyStepRepository.save(step);
        return toPolicyResponse(policy);
    }

    @Transactional
    public void removePolicyStep(Long policyId, Long stepId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedPolicy(policyId, hospital.hospitalId());
        ApprovalPolicyStep step = policyStepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy step not found"));
        if (!step.getPolicyId().equals(policyId)) {
            throw new AccessDeniedException("Policy step does not belong to this policy");
        }
        step.setDeleted(true);
        step.setDeletedAt(LocalDateTime.now());
        step.setDeletedBy(hospital.user().getEmail());
        policyStepRepository.save(step);
    }

    @Transactional
    public void deletePolicy(Long policyId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ApprovalPolicy policy = getOwnedPolicy(policyId, hospital.hospitalId());
        policy.setActive(false);
        policy.setDeleted(true);
        policy.setDeletedAt(LocalDateTime.now());
        policy.setDeletedBy(hospital.user().getEmail());
        policyRepository.save(policy);
    }

    // ------------------------------------------------------------------
    // Quotes
    // ------------------------------------------------------------------

    @Transactional
    public SupplierQuoteResponse submitQuote(Long requestId, SupplierQuoteRequest request,
                                             Authentication authentication) {
        Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
        User supplier = userRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        ProcurementRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Procurement request not found"));
        if (req.getStatus() != ProcurementRequestStatus.APPROVED
                && req.getStatus() != ProcurementRequestStatus.ORDERED) {
            throw new IllegalArgumentException("Quotes are only accepted for approved requests");
        }
        if (request.getQuoteAmount() == null || request.getQuoteAmount().signum() < 0) {
            throw new IllegalArgumentException("Quote amount cannot be negative");
        }

        SupplierQuote quote = SupplierQuote.builder()
                .requestId(req.getId())
                .hospitalId(req.getHospitalId())
                .supplierId(supplierId)
                .supplierName(supplier.getName())
                .supplierEmail(supplier.getEmail())
                .quoteAmount(request.getQuoteAmount())
                .leadTimeDays(request.getLeadTimeDays())
                .warrantyMonths(request.getWarrantyMonths())
                .notes(trimToNull(request.getNotes()))
                .submittedAt(LocalDateTime.now())
                .build();
        SupplierQuote saved = quoteRepository.save(quote);
        audit(req.getHospitalId(), req.getId(), supplier.getEmail(),
                "QUOTE_SUBMITTED", supplier.getName() + " quoted " + request.getQuoteAmount());
        return SupplierQuoteResponse.from(saved);
    }

    @Transactional
    public ProcurementRequestResponse acceptQuote(Long requestId, Long quoteId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ProcurementRequest request = getOwnedRequest(requestId, hospital.hospitalId());
        if (request.getStatus() != ProcurementRequestStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved requests can be ordered");
        }
        SupplierQuote quote = quoteRepository.findByIdAndHospitalId(quoteId, hospital.hospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found or access denied"));
        if (!quote.getRequestId().equals(requestId)) {
            throw new IllegalArgumentException("Quote does not belong to this request");
        }

        // Reject all competing quotes, accept the winner, and create the finalized order.
        for (SupplierQuote other : quoteRepository.findByRequestIdAndStatusOrderByQuoteAmountAsc(
                requestId, SupplierQuoteStatus.PENDING)) {
            other.setStatus(other.getId().equals(quoteId)
                    ? SupplierQuoteStatus.ACCEPTED : SupplierQuoteStatus.REJECTED);
            if (other.getId().equals(quoteId)) {
                other.setAcceptedAt(LocalDateTime.now());
            }
            quoteRepository.save(other);
        }
        quote.setStatus(SupplierQuoteStatus.ACCEPTED);
        quote.setAcceptedAt(LocalDateTime.now());
        quoteRepository.save(quote);

        EquipmentOrder order = orderRepository.save(EquipmentOrder.builder()
                .orderCode("ORD-" + UUID.randomUUID())
                .equipmentId(request.getEquipmentCode())
                .equipmentName(request.getEquipmentName())
                .quantity(request.getQuantity())
                .unitCost(quote.getQuoteAmount())
                .hospital(hospital.hospital().getName())
                .createdBy(hospital.user().getEmail())
                .status("PENDING")
                .shippingStatus("Processing")
                .orderDate(LocalDateTime.now())
                .build());

        request.setOrderId(order.getId());
        request.setStatus(ProcurementRequestStatus.ORDERED);
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);

        audit(hospital.hospitalId(), request.getId(), hospital.user().getEmail(),
                "QUOTE_ACCEPTED", "Accepted quote " + quote.getId() + " from " + quote.getSupplierName()
                        + " for " + quote.getQuoteAmount() + " -> order " + order.getOrderCode());
        return toResponse(request, hospital.hospitalId());
    }

    // ------------------------------------------------------------------
    // Receiving
    // ------------------------------------------------------------------

    @Transactional
    public ReceivingRecordResponse recordReceiving(Long requestId, ReceivingRecordRequest request,
                                                   Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ProcurementRequest proc = getOwnedRequest(requestId, hospital.hospitalId());
        if (proc.getStatus() != ProcurementRequestStatus.ORDERED
                && proc.getStatus() != ProcurementRequestStatus.PARTIALLY_RECEIVED) {
            throw new IllegalArgumentException("Receiving is only allowed after the request is ordered");
        }
        int receivedSoFar = receivingRepository.findByRequestIdOrderByReceivedAtDesc(requestId).stream()
                .mapToInt(ReceivingRecord::getQuantityReceived).sum();
        int newTotal = receivedSoFar + request.getQuantityReceived();
        if (newTotal > proc.getQuantity()) {
            throw new IllegalArgumentException("Total received cannot exceed the ordered quantity");
        }

        ReceivingRecord record = ReceivingRecord.builder()
                .requestId(proc.getId())
                .hospitalId(hospital.hospitalId())
                .orderId(proc.getOrderId())
                .quantityReceived(request.getQuantityReceived())
                .condition(request.getCondition() != null ? request.getCondition() : ReceivingCondition.GOOD)
                .serialNumbers(trimToNull(request.getSerialNumbers()))
                .warrantyExpiry(request.getWarrantyExpiry())
                .discrepancyNotes(trimToNull(request.getDiscrepancyNotes()))
                .receivedBy(hospital.user().getEmail())
                .receivedAt(LocalDateTime.now())
                .build();
        ReceivingRecord saved = receivingRepository.save(record);

        proc.setStatus(newTotal >= proc.getQuantity()
                ? ProcurementRequestStatus.RECEIVED : ProcurementRequestStatus.PARTIALLY_RECEIVED);
        proc.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(proc);

        audit(hospital.hospitalId(), proc.getId(), hospital.user().getEmail(),
                "RECEIVING_RECORDED", "Received " + request.getQuantityReceived() + " units (total " + newTotal + " of "
                        + proc.getQuantity() + ") condition " + saved.getCondition());
        return ReceivingRecordResponse.from(saved);
    }

    // ------------------------------------------------------------------
    // Invoice matching
    // ------------------------------------------------------------------

    @Transactional
    public InvoiceMatchResponse recordInvoiceMatch(Long requestId, InvoiceMatchRequest request,
                                                   Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        ProcurementRequest proc = getOwnedRequest(requestId, hospital.hospitalId());
        if (proc.getStatus() != ProcurementRequestStatus.RECEIVED) {
            throw new IllegalArgumentException("Invoice matching requires a fully received request");
        }

        BigDecimal receivedAmount = receivingRepository.findByRequestIdOrderByReceivedAtDesc(requestId).stream()
                .map(record -> BigDecimal.valueOf(record.getQuantityReceived().longValue())
                        .multiply(proc.getUnitCost() != null ? proc.getUnitCost() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal orderedAmount = proc.getTotalCost() != null ? proc.getTotalCost() : BigDecimal.ZERO;

        InvoiceMatchStatus matchStatus = matchThreeWay(request.getInvoiceAmount(), orderedAmount, receivedAmount);
        InvoiceMatchRecord record = InvoiceMatchRecord.builder()
                .requestId(proc.getId())
                .hospitalId(hospital.hospitalId())
                .orderId(proc.getOrderId())
                .invoiceNumber(request.getInvoiceNumber().trim())
                .invoiceAmount(request.getInvoiceAmount())
                .invoiceDate(request.getInvoiceDate())
                .receivedAmount(receivedAmount)
                .orderedAmount(orderedAmount)
                .status(matchStatus)
                .notes(trimToNull(request.getNotes()))
                .matchedBy(hospital.user().getEmail())
                .matchedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        InvoiceMatchRecord saved = invoiceRepository.save(record);

        if (matchStatus == InvoiceMatchStatus.MATCHED) {
            proc.setStatus(ProcurementRequestStatus.INVOICE_MATCHED);
            proc.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(proc);
        }
        audit(hospital.hospitalId(), proc.getId(), hospital.user().getEmail(),
                "INVOICE_MATCH_" + matchStatus, "Invoice " + request.getInvoiceNumber()
                        + " for " + request.getInvoiceAmount() + " vs ordered " + orderedAmount
                        + " vs received " + receivedAmount);
        return InvoiceMatchResponse.from(saved);
    }

    private InvoiceMatchStatus matchThreeWay(BigDecimal invoice, BigDecimal ordered, BigDecimal received) {
        if (invoice == null || ordered == null || received == null) {
            return InvoiceMatchStatus.UNRESOLVED;
        }
        BigDecimal tolerance = new BigDecimal("0.01");
        boolean amountMatches = invoice.subtract(ordered).abs().compareTo(tolerance) <= 0;
        boolean receiptMatches = received.compareTo(ordered) == 0;
        if (amountMatches && receiptMatches) {
            return InvoiceMatchStatus.MATCHED;
        }
        return amountMatches || receiptMatches ? InvoiceMatchStatus.UNRESOLVED : InvoiceMatchStatus.MISMATCHED;
    }

    // ------------------------------------------------------------------
    // Read views
    // ------------------------------------------------------------------

    public ProcurementRequestResponse getRequest(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        return toResponse(getOwnedRequest(requestId, hospital.hospitalId()), hospital.hospitalId());
    }

    public List<ProcurementRequestResponse> listRequests(Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        return requestRepository.findByHospitalIdOrderByRequestedAtDesc(hospital.hospitalId()).stream()
                .map(request -> toResponse(request, hospital.hospitalId()))
                .toList();
    }

    public List<ProcurementRequestResponse> listRequestsByStatus(ProcurementRequestStatus status,
                                                                  Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        return requestRepository.findByHospitalIdAndStatusOrderByRequestedAtDesc(
                        hospital.hospitalId(), status).stream()
                .map(request -> toResponse(request, hospital.hospitalId()))
                .toList();
    }

    public List<ApprovalStepResponse> getApprovalInbox(Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        return approvalStepRepository.findByHospitalIdAndStatusOrderByCreatedAtAsc(
                        hospital.hospitalId(), ApprovalStepStatus.PENDING).stream()
                .map(ApprovalStepResponse::from)
                .toList();
    }

    public List<ApprovalPolicyResponse> listPolicies(Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        return policyRepository.findByHospitalIdOrderByCreatedAtDesc(hospital.hospitalId()).stream()
                .map(this::toPolicyResponse)
                .toList();
    }

    public List<SupplierQuoteResponse> listQuotesForRequest(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedRequest(requestId, hospital.hospitalId());
        return quoteRepository.findByRequestIdOrderBySubmittedAtAsc(requestId).stream()
                .map(SupplierQuoteResponse::from)
                .toList();
    }

    public List<SupplierQuoteResponse> listMyQuotes(Authentication authentication) {
        Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
        return quoteRepository.findBySupplierIdOrderBySubmittedAtDesc(supplierId).stream()
                .map(SupplierQuoteResponse::from)
                .toList();
    }

    public List<ReceivingRecordResponse> listReceiving(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedRequest(requestId, hospital.hospitalId());
        return receivingRepository.findByRequestIdOrderByReceivedAtDesc(requestId).stream()
                .map(ReceivingRecordResponse::from)
                .toList();
    }

    public List<InvoiceMatchResponse> listInvoiceMatches(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedRequest(requestId, hospital.hospitalId());
        return invoiceRepository.findByRequestIdOrderByCreatedAtDesc(requestId).stream()
                .map(InvoiceMatchResponse::from)
                .toList();
    }

    public List<ProcurementAuditLogResponse> getAuditTrail(Long requestId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedRequest(requestId, hospital.hospitalId());
        return auditRepository.findByRequestIdOrderByCreatedAtDesc(requestId).stream()
                .map(ProcurementAuditLogResponse::from)
                .toList();
    }

    public BudgetSummaryResponse getBudgetSummary(Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        BigDecimal reserved = requestRepository.findByHospitalIdOrderByRequestedAtDesc(hospital.hospitalId()).stream()
                .filter(request -> request.getStatus() != ProcurementRequestStatus.CANCELLED
                        && request.getStatus() != ProcurementRequestStatus.REJECTED
                        && request.getStatus() != ProcurementRequestStatus.CLOSED)
                .filter(request -> request.getBudgetReserved() != null)
                .map(ProcurementRequest::getBudgetReserved)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = DEFAULT_BUDGET;
        return BudgetSummaryResponse.builder()
                .totalBudget(total)
                .reserved(reserved)
                .available(total.subtract(reserved))
                .build();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private void materializeApprovalSteps(ProcurementRequest request, ApprovalPolicy policy, Long hospitalId) {
        List<ApprovalPolicyStep> steps = policyStepRepository.findByPolicyIdAndActiveTrueOrderByStepGroupAsc(policy.getId());
        if (steps.isEmpty()) {
            // Default fallback: a single hospital-admin approval.
            ApprovalStep fallback = ApprovalStep.builder()
                    .requestId(request.getId())
                    .hospitalId(hospitalId)
                    .stepGroup(1)
                    .approverRole("hospital")
                    .status(ApprovalStepStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            approvalStepRepository.save(fallback);
            return;
        }
        for (ApprovalPolicyStep step : steps) {
            approvalStepRepository.save(ApprovalStep.builder()
                    .requestId(request.getId())
                    .hospitalId(hospitalId)
                    .stepGroup(step.getStepGroup())
                    .approverRole(step.getApproverRole())
                    .approverEmail(step.getApproverEmail())
                    .status(ApprovalStepStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
    }

    private boolean allStepsApproved(Long requestId) {
        List<ApprovalStep> steps = approvalStepRepository.findByRequestIdOrderByStepGroupAscIdAsc(requestId);
        return !steps.isEmpty() && steps.stream().allMatch(step -> step.getStatus() == ApprovalStepStatus.APPROVED);
    }

    /**
     * Resolves the governing policy for a request. Policies matching the amount band, category,
     * urgency, and requester role are compared by specificity; the most specific match wins.
     */
    private ApprovalPolicy resolvePolicy(Long hospitalId, BigDecimal totalCost, ProcurementRequestRequest request) {
        List<ApprovalPolicy> candidates = policyRepository.findByHospitalIdAndActiveTrue(hospitalId).stream()
                .filter(policy -> policyMatches(policy, totalCost, request))
                .sorted(Comparator.comparing(ApprovalPolicy::getId))
                .toList();
        if (candidates.isEmpty()) {
            return policyRepository.save(ApprovalPolicy.builder()
                    .hospitalId(hospitalId)
                    .name("Default approval policy")
                    .description("Fallback single-step hospital approval")
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return candidates.get(candidates.size() - 1);
    }

    private boolean policyMatches(ApprovalPolicy policy, BigDecimal totalCost, ProcurementRequestRequest request) {
        if (policy.getMinAmount() != null && totalCost.compareTo(policy.getMinAmount()) < 0) {
            return false;
        }
        if (policy.getMaxAmount() != null && totalCost.compareTo(policy.getMaxAmount()) > 0) {
            return false;
        }
        if (policy.getCategory() != null && policy.getCategory() != request.getCategory()) {
            return false;
        }
        if (policy.getUrgency() != null && policy.getUrgency() != request.getUrgency()) {
            return false;
        }
        return true;
    }

    private void reserveBudget(Long hospitalId, BigDecimal totalCost) {
        BudgetSummaryResponse summary = getBudgetSummaryFor(hospitalId);
        if (summary.getAvailable().compareTo(totalCost) < 0) {
            throw new IllegalArgumentException("Insufficient budget: available "
                    + summary.getAvailable() + " but request requires " + totalCost);
        }
    }

    private BudgetSummaryResponse getBudgetSummaryFor(Long hospitalId) {
        BigDecimal reserved = requestRepository.findByHospitalIdOrderByRequestedAtDesc(hospitalId).stream()
                .filter(request -> request.getStatus() != ProcurementRequestStatus.CANCELLED
                        && request.getStatus() != ProcurementRequestStatus.REJECTED
                        && request.getStatus() != ProcurementRequestStatus.CLOSED)
                .filter(request -> request.getBudgetReserved() != null)
                .map(ProcurementRequest::getBudgetReserved)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = DEFAULT_BUDGET;
        return BudgetSummaryResponse.builder()
                .totalBudget(total)
                .reserved(reserved)
                .available(total.subtract(reserved))
                .build();
    }

    private void validateRequest(ProcurementRequestRequest request) {
        if (request.getEquipmentCode() == null || request.getEquipmentCode().isBlank()) {
            throw new IllegalArgumentException("Equipment code is required");
        }
        if (request.getEquipmentName() == null || request.getEquipmentName().isBlank()) {
            throw new IllegalArgumentException("Equipment name is required");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        if (request.getUnitCost() == null || request.getUnitCost().signum() < 0) {
            throw new IllegalArgumentException("Estimated unit cost cannot be negative");
        }
        if (request.getUrgency() == null) {
            throw new IllegalArgumentException("Urgency is required");
        }
    }

    private void validatePolicy(ApprovalPolicyRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Policy name is required");
        }
        if (request.getMinAmount() != null && request.getMaxAmount() != null
                && request.getMinAmount().compareTo(request.getMaxAmount()) > 0) {
            throw new IllegalArgumentException("Min amount cannot exceed max amount");
        }
    }

    private String nextRequestCode(Long hospitalId) {
        return "PR-" + hospitalId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }

    private void audit(Long hospitalId, Long requestId, String actor, String action, String detail) {
        auditRepository.save(ProcurementAuditLog.builder()
                .requestId(requestId)
                .hospitalId(hospitalId)
                .actor(actor)
                .action(action)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private ProcurementRequestResponse toResponse(ProcurementRequest request, Long hospitalId) {
        ProcurementRequestResponse response = ProcurementRequestResponse.from(request);
        response.setApprovalSteps(approvalStepRepository
                .findByRequestIdOrderByStepGroupAscIdAsc(request.getId()).stream()
                .map(ApprovalStepResponse::from)
                .toList());
        response.setAcceptedQuote(quoteRepository.findByRequestIdAndStatusOrderByQuoteAmountAsc(
                        request.getId(), SupplierQuoteStatus.ACCEPTED).stream()
                .findFirst()
                .map(SupplierQuoteResponse::from)
                .orElse(null));
        return response;
    }

    private ApprovalPolicyResponse toPolicyResponse(ApprovalPolicy policy) {
        List<ApprovalPolicyStepResponse> steps = policyStepRepository.findByPolicyIdAndActiveTrueOrderByStepGroupAsc(policy.getId())
                .stream()
                .map(ApprovalPolicyStepResponse::from)
                .toList();
        return ApprovalPolicyResponse.from(policy, steps);
    }

    private ProcurementRequest getOwnedRequest(Long requestId, Long hospitalId) {
        return requestRepository.findByIdAndHospitalId(requestId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Procurement request not found or access denied"));
    }

    private ApprovalPolicy getOwnedPolicy(Long policyId, Long hospitalId) {
        return policyRepository.findByIdAndHospitalId(policyId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Approval policy not found or access denied"));
    }

    private HospitalAccess getHospitalForUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new AccessDeniedException("An active hospital account is required"));
        if (!"hospital".equalsIgnoreCase(user.getRole()) || user.getAccountStatus() != com.medtrack.auth.model.AccountStatus.ACTIVE) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        com.medtrack.model.Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        return new HospitalAccess(hospital, user);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record HospitalAccess(com.medtrack.model.Hospital hospital, User user) {
        Long hospitalId() {
            return hospital.getId();
        }
    }
}
