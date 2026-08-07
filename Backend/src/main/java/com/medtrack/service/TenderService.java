package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.TenderAuditLogResponse;
import com.medtrack.dto.TenderAwardRequest;
import com.medtrack.dto.TenderBidRequest;
import com.medtrack.dto.TenderBidResponse;
import com.medtrack.dto.TenderRequest;
import com.medtrack.dto.TenderResponse;
import com.medtrack.dto.TenderRoundRequest;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.Tender;
import com.medtrack.model.TenderAuditLog;
import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import com.medtrack.model.TenderStatus;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.TenderAuditLogRepository;
import com.medtrack.repository.TenderBidRepository;
import com.medtrack.repository.TenderRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Multi-supplier tender / e-auction workflow.
 *
 * <p>Extends the single-shot RFQ flow with a structured, auditable competition: hospitals publish a
 * requirement with specifications and a deadline, invite suppliers by email, run one or more bidding
 * rounds, compare bids side by side (price, lead time, quality score, delivery performance), and
 * award a winner. Every transition - publication, round opens/closes, bid submission/withdrawal,
 * and the award decision with its reason - is written to the tender audit log.</p>
 */
@Service
@RequiredArgsConstructor
public class TenderService {

    private static final Logger log = LoggerFactory.getLogger(TenderService.class);

    private final TenderRepository tenderRepository;
    private final TenderBidRepository bidRepository;
    private final TenderAuditLogRepository auditRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final SupplierAccessGuard supplierAccessGuard;

    // ------------------------------------------------------------------
    // Hospital: create / publish / rounds / award / cancel
    // ------------------------------------------------------------------

    @Transactional
    public TenderResponse createTender(TenderRequest request, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        validateTenderRequest(request);

        Tender tender = Tender.builder()
                .tenderCode(nextTenderCode(hospital.hospitalId()))
                .hospitalId(hospital.hospitalId())
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .specifications(trimToNull(request.getSpecifications()))
                .category(trimToNull(request.getCategory()))
                .quantity(request.getQuantity())
                .estimatedBudget(request.getEstimatedBudget())
                .deadline(request.getDeadline())
                .status(TenderStatus.DRAFT)
                .currentRound(1)
                .invitedSupplierEmails(joinEmails(request.getInvitedSupplierEmails()))
                .createdBy(hospital.user().getEmail())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Tender saved = tenderRepository.save(tender);

        audit(saved, hospital.user().getEmail(), "TENDER_CREATED",
                "Tender '" + saved.getTitle() + "' created in draft (round 1, deadline "
                        + saved.getDeadline() + ")");
        log.info("Tender {} created by hospital {}", saved.getTenderCode(), hospital.hospitalId());
        return toResponse(saved);
    }

    @Transactional
    public TenderResponse publishTender(Long tenderId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        Tender tender = getOwnedTender(tenderId, hospital.hospitalId());
        if (tender.getStatus() != TenderStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft tenders can be published");
        }
        if (tender.getDeadline() != null && !tender.getDeadline().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Tender deadline must be in the future");
        }
        tender.setStatus(TenderStatus.OPEN);
        tender.setPublishedAt(LocalDateTime.now());
        tender.setUpdatedAt(LocalDateTime.now());
        tenderRepository.save(tender);

        audit(tender, hospital.user().getEmail(), "TENDER_PUBLISHED",
                "Tender published to " + invitedSummary(tender) + " for round " + tender.getCurrentRound()
                        + " (deadline " + tender.getDeadline() + ")");
        return toResponse(tender);
    }

    @Transactional
    public TenderResponse closeRound(Long tenderId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        Tender tender = getOwnedTender(tenderId, hospital.hospitalId());
        if (tender.getStatus() != TenderStatus.OPEN) {
            throw new IllegalArgumentException("Only open tenders can have their round closed");
        }
        tender.setStatus(TenderStatus.CLOSED);
        tender.setUpdatedAt(LocalDateTime.now());
        tenderRepository.save(tender);

        audit(tender, hospital.user().getEmail(), "ROUND_CLOSED",
                "Round " + tender.getCurrentRound() + " closed with "
                        + bidRepository.countByTenderIdAndRoundNumber(tender.getId(), tender.getCurrentRound())
                        + " bid(s)");
        return toResponse(tender);
    }

    @Transactional
    public TenderResponse openNextRound(Long tenderId, TenderRoundRequest request,
                                        Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        Tender tender = getOwnedTender(tenderId, hospital.hospitalId());
        if (tender.getStatus() != TenderStatus.CLOSED && tender.getStatus() != TenderStatus.DRAFT) {
            throw new IllegalArgumentException("A new round can only be opened from a closed or draft tender");
        }
        int nextRound = tender.getStatus() == TenderStatus.DRAFT ? 1 : tender.getCurrentRound() + 1;
        if (request.getRound() != null && request.getRound() != nextRound) {
            throw new IllegalArgumentException("Round number must be " + nextRound + " for the next round");
        }
        if (!request.getDeadline().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Round deadline must be in the future");
        }
        tender.setStatus(TenderStatus.OPEN);
        tender.setCurrentRound(nextRound);
        tender.setDeadline(request.getDeadline());
        tender.setUpdatedAt(LocalDateTime.now());
        tenderRepository.save(tender);

        audit(tender, hospital.user().getEmail(), "ROUND_OPENED",
                "Round " + nextRound + " opened for bidding (deadline " + request.getDeadline() + ")");
        return toResponse(tender);
    }

    @Transactional
    public TenderResponse awardTender(Long tenderId, TenderAwardRequest request,
                                      Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        Tender tender = getOwnedTender(tenderId, hospital.hospitalId());
        if (tender.getStatus() != TenderStatus.CLOSED && tender.getStatus() != TenderStatus.OPEN) {
            throw new IllegalArgumentException("Tender must be open or closed to award a winner");
        }
        TenderBid winner = bidRepository.findByIdAndTenderId(request.getBidId(), tenderId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found for this tender"));
        if (winner.getStatus() == TenderBidStatus.WITHDRAWN) {
            throw new IllegalArgumentException("A withdrawn bid cannot win the tender");
        }

        // Accept the winner, reject every other live bid - the full decision is recorded.
        for (TenderBid bid : bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(tenderId)) {
            if (Objects.equals(bid.getId(), winner.getId())) {
                bid.setStatus(TenderBidStatus.ACCEPTED);
            } else if (bid.getStatus() == TenderBidStatus.SUBMITTED) {
                bid.setStatus(TenderBidStatus.REJECTED);
            } else {
                continue;
            }
            bid.setDecidedAt(LocalDateTime.now());
            bidRepository.save(bid);
        }

        tender.setStatus(TenderStatus.AWARDED);
        tender.setAwardedBidId(winner.getId());
        tender.setAwardReason(trimToNull(request.getReason()));
        tender.setAwardedAt(LocalDateTime.now());
        tender.setUpdatedAt(LocalDateTime.now());
        tenderRepository.save(tender);

        audit(tender, hospital.user().getEmail(), "TENDER_AWARDED",
                "Awarded to " + winner.getSupplierName() + " (" + winner.getSupplierEmail()
                        + ") for " + winner.getBidAmount() + " - round " + winner.getRoundNumber()
                        + " - reason: " + (tender.getAwardReason() != null ? tender.getAwardReason() : "not supplied"));
        log.info("Tender {} awarded to bid {} by hospital {}", tender.getTenderCode(), winner.getId(),
                hospital.hospitalId());
        return toResponse(tender);
    }

    @Transactional
    public TenderResponse cancelTender(Long tenderId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        Tender tender = getOwnedTender(tenderId, hospital.hospitalId());
        if (tender.getStatus() == TenderStatus.AWARDED || tender.getStatus() == TenderStatus.CANCELLED) {
            throw new IllegalArgumentException("An awarded or cancelled tender cannot be cancelled");
        }
        tender.setStatus(TenderStatus.CANCELLED);
        tender.setUpdatedAt(LocalDateTime.now());
        tenderRepository.save(tender);

        audit(tender, hospital.user().getEmail(), "TENDER_CANCELLED",
                "Tender cancelled by " + hospital.user().getEmail());
        return toResponse(tender);
    }

    // ------------------------------------------------------------------
    // Supplier: bid / withdraw
    // ------------------------------------------------------------------

    @Transactional
    public TenderBidResponse submitBid(Long tenderId, TenderBidRequest request,
                                       Authentication authentication) {
        Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
        User supplier = userRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier account not found"));
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new ResourceNotFoundException("Tender not found"));

        if (tender.getStatus() != TenderStatus.OPEN) {
            throw new IllegalArgumentException("This tender is not accepting bids");
        }
        if (tender.getDeadline() != null && !tender.getDeadline().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("The bid deadline for this round has passed");
        }
        assertInvited(tender, supplier.getEmail());
        if (bidRepository.existsByTenderIdAndSupplierIdAndRoundNumberAndStatus(
                tenderId, supplierId, tender.getCurrentRound(), TenderBidStatus.SUBMITTED)) {
            throw new IllegalArgumentException("You have already submitted a bid for this round");
        }
        if (request.getBidAmount() == null || request.getBidAmount().signum() < 0) {
            throw new IllegalArgumentException("Bid amount cannot be negative");
        }

        TenderBid bid = TenderBid.builder()
                .tenderId(tender.getId())
                .hospitalId(tender.getHospitalId())
                .roundNumber(tender.getCurrentRound())
                .supplierId(supplierId)
                .supplierName(supplier.getName())
                .supplierEmail(supplier.getEmail())
                .bidAmount(request.getBidAmount())
                .leadTimeDays(request.getLeadTimeDays())
                .qualityScore(request.getQualityScore())
                .deliveryScore(request.getDeliveryScore())
                .notes(trimToNull(request.getNotes()))
                .status(TenderBidStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();
        TenderBid saved = bidRepository.save(bid);

        audit(tender, supplier.getEmail(), "BID_SUBMITTED",
                supplier.getName() + " bid " + saved.getBidAmount() + " (round " + saved.getRoundNumber()
                        + ", lead time " + saved.getLeadTimeDays() + " days, quality " + saved.getQualityScore()
                        + ", delivery " + saved.getDeliveryScore() + ")");
        return TenderBidResponse.from(saved);
    }

    @Transactional
    public TenderBidResponse withdrawBid(Long tenderId, Long bidId, Authentication authentication) {
        Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new ResourceNotFoundException("Tender not found"));
        TenderBid bid = bidRepository.findByIdAndTenderIdAndSupplierId(bidId, tenderId, supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found or access denied"));
        if (bid.getStatus() != TenderBidStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only submitted bids can be withdrawn");
        }
        if (tender.getStatus() != TenderStatus.OPEN) {
            throw new IllegalArgumentException("Bids can only be withdrawn while the tender is open");
        }
        bid.setStatus(TenderBidStatus.WITHDRAWN);
        bid.setDecidedAt(LocalDateTime.now());
        bidRepository.save(bid);

        audit(tender, bid.getSupplierEmail(), "BID_WITHDRAWN",
                bid.getSupplierName() + " withdrew bid " + bid.getId() + " (round " + bid.getRoundNumber() + ")");
        return TenderBidResponse.from(bid);
    }

    // ------------------------------------------------------------------
    // Read views
    // ------------------------------------------------------------------

    public List<TenderResponse> listTenders(Authentication authentication) {
        if (supplierAccessGuard.isSupplier(authentication)) {
            Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
            User supplier = userRepository.findById(supplierId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier account not found"));
            return tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN).stream()
                    .filter(tender -> isInvited(tender, supplier.getEmail()))
                    .map(this::toResponse)
                    .toList();
        }
        HospitalAccess hospital = getHospitalForUser(authentication);
        return tenderRepository.findByHospitalIdOrderByCreatedAtDesc(hospital.hospitalId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public TenderResponse getTender(Long tenderId, Authentication authentication) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new ResourceNotFoundException("Tender not found"));
        if (supplierAccessGuard.isSupplier(authentication)) {
            Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
            User supplier = userRepository.findById(supplierId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier account not found"));
            if (!isInvited(tender, supplier.getEmail())) {
                throw new AccessDeniedException("You are not invited to this tender");
            }
            // Suppliers only see their own bids: competitor prices stay sealed until the award.
            List<TenderBidResponse> ownBids = bidRepository
                    .findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(tenderId).stream()
                    .filter(bid -> Objects.equals(bid.getSupplierId(), supplierId))
                    .map(TenderBidResponse::from)
                    .toList();
            return TenderResponse.from(tender, ownBids);
        }
        HospitalAccess hospital = getHospitalForUser(authentication);
        if (!Objects.equals(tender.getHospitalId(), hospital.hospitalId())) {
            throw new AccessDeniedException("This tender does not belong to your hospital");
        }
        return toResponse(tender);
    }

    public List<TenderBidResponse> listBids(Long tenderId, Authentication authentication) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new ResourceNotFoundException("Tender not found"));
        List<TenderBid> bids = bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(tenderId);
        if (supplierAccessGuard.isSupplier(authentication)) {
            Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
            // Suppliers only ever see their own bids; the hospital sees the full comparison set.
            return bids.stream()
                    .filter(bid -> Objects.equals(bid.getSupplierId(), supplierId))
                    .map(TenderBidResponse::from)
                    .toList();
        }
        HospitalAccess hospital = getHospitalForUser(authentication);
        if (!Objects.equals(tender.getHospitalId(), hospital.hospitalId())) {
            throw new AccessDeniedException("This tender does not belong to your hospital");
        }
        return bids.stream().map(TenderBidResponse::from).toList();
    }

    public List<TenderAuditLogResponse> getAuditTrail(Long tenderId, Authentication authentication) {
        HospitalAccess hospital = getHospitalForUser(authentication);
        getOwnedTender(tenderId, hospital.hospitalId());
        return auditRepository.findByTenderIdOrderByCreatedAtDesc(tenderId).stream()
                .map(TenderAuditLogResponse::from)
                .toList();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private TenderResponse toResponse(Tender tender) {
        List<TenderBidResponse> bids = bidRepository
                .findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(tender.getId()).stream()
                .map(TenderBidResponse::from)
                .toList();
        return TenderResponse.from(tender, bids);
    }

    private void validateTenderRequest(TenderRequest request) {
        if (request.getDeadline() != null && !request.getDeadline().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Tender deadline must be in the future");
        }
        if (request.getInvitedSupplierEmails() != null) {
            for (String email : request.getInvitedSupplierEmails()) {
                if (email == null || email.isBlank()) {
                    throw new IllegalArgumentException("Invited supplier emails cannot be blank");
                }
            }
        }
    }

    private Tender getOwnedTender(Long tenderId, Long hospitalId) {
        return tenderRepository.findByIdAndHospitalId(tenderId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Tender not found or access denied"));
    }

    private void assertInvited(Tender tender, String supplierEmail) {
        if (!isInvited(tender, supplierEmail)) {
            throw new AccessDeniedException("Your supplier account is not invited to this tender");
        }
    }

    private boolean isInvited(Tender tender, String supplierEmail) {
        Set<String> invited = parseEmails(tender.getInvitedSupplierEmails());
        return invited.isEmpty() || invited.contains(supplierEmail.trim().toLowerCase(Locale.ROOT));
    }

    private String invitedSummary(Tender tender) {
        Set<String> invited = parseEmails(tender.getInvitedSupplierEmails());
        if (invited.isEmpty()) {
            return "all registered suppliers";
        }
        return invited.size() + " invited supplier(s)";
    }

    private Set<String> parseEmails(String stored) {
        if (stored == null || stored.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(stored.split(","))
                .map(String::trim)
                .map(email -> email.toLowerCase(Locale.ROOT))
                .filter(email -> !email.isBlank())
                .collect(Collectors.toSet());
    }

    private String joinEmails(List<String> emails) {
        if (emails == null || emails.isEmpty()) {
            return null;
        }
        return emails.stream()
                .map(String::trim)
                .map(email -> email.toLowerCase(Locale.ROOT))
                .filter(email -> !email.isBlank())
                .distinct()
                .collect(Collectors.joining(","));
    }

    private String nextTenderCode(Long hospitalId) {
        return "TND-" + hospitalId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }

    private void audit(Tender tender, String actor, String action, String detail) {
        auditRepository.save(TenderAuditLog.builder()
                .tenderId(tender.getId())
                .hospitalId(tender.getHospitalId())
                .actor(actor)
                .action(action)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private HospitalAccess getHospitalForUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new AccessDeniedException("An active hospital account is required"));
        if (!"hospital".equalsIgnoreCase(user.getRole()) || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException("An active hospital account is required");
        }
        Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        return new HospitalAccess(hospital, user);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record HospitalAccess(Hospital hospital, User user) {
        Long hospitalId() {
            return hospital.getId();
        }
    }
}
