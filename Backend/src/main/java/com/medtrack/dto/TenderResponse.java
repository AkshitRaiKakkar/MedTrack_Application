package com.medtrack.dto;

import com.medtrack.model.Tender;
import com.medtrack.model.TenderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Hospital-facing view of a tender, including the current round's bids for side-by-side comparison.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderResponse {

    private Long id;
    private String tenderCode;
    private Long hospitalId;
    private String title;
    private String description;
    private String specifications;
    private String category;
    private Integer quantity;
    private BigDecimal estimatedBudget;
    private LocalDateTime deadline;
    private TenderStatus status;
    private Integer currentRound;
    private List<String> invitedSupplierEmails;
    private Long awardedBidId;
    private String awardReason;
    private String createdBy;
    private LocalDateTime publishedAt;
    private LocalDateTime awardedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Whether the bid window for the current round is still open. */
    private boolean biddingOpen;

    /** Whether the hospital has already chosen a winner. */
    private boolean awarded;

    private List<TenderBidResponse> bids;

    public static TenderResponse from(Tender tender, List<TenderBidResponse> bids) {
        boolean open = tender.getStatus() == TenderStatus.OPEN
                && (tender.getDeadline() == null || tender.getDeadline().isAfter(LocalDateTime.now()));
        return TenderResponse.builder()
                .id(tender.getId())
                .tenderCode(tender.getTenderCode())
                .hospitalId(tender.getHospitalId())
                .title(tender.getTitle())
                .description(tender.getDescription())
                .specifications(tender.getSpecifications())
                .category(tender.getCategory())
                .quantity(tender.getQuantity())
                .estimatedBudget(tender.getEstimatedBudget())
                .deadline(tender.getDeadline())
                .status(tender.getStatus())
                .currentRound(tender.getCurrentRound())
                .invitedSupplierEmails(parseEmails(tender.getInvitedSupplierEmails()))
                .awardedBidId(tender.getAwardedBidId())
                .awardReason(tender.getAwardReason())
                .createdBy(tender.getCreatedBy())
                .publishedAt(tender.getPublishedAt())
                .awardedAt(tender.getAwardedAt())
                .createdAt(tender.getCreatedAt())
                .updatedAt(tender.getUpdatedAt())
                .biddingOpen(open)
                .awarded(tender.getStatus() == TenderStatus.AWARDED)
                .bids(bids)
                .build();
    }

    private static List<String> parseEmails(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .toList();
    }
}
