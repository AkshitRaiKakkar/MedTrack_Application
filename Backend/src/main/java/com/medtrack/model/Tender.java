package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A competitively tendered procurement requirement.
 *
 * <p>Hospitals publish a specification with a deadline and a list of invited supplier emails,
 * suppliers submit bids per round, and the hospital compares bids side by side and awards the
 * winner. Every transition is written to {@link TenderAuditLog} so the whole process - invitations,
 * rounds, every bid, and the final decision - is auditable.</p>
 */
@Entity
@Table(name = "tenders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tender_code", nullable = false, length = 64, unique = true)
    private String tenderCode;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @Column(name = "category", length = 64)
    private String category;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "estimated_budget", precision = 14, scale = 2)
    private BigDecimal estimatedBudget;

    /**
     * Deadline for the current round. When a new round opens, the hospital supplies a fresh
     * deadline so later rounds do not silently reuse an expired one.
     */
    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TenderStatus status = TenderStatus.DRAFT;

    @Column(name = "current_round", nullable = false)
    @Builder.Default
    private Integer currentRound = 1;

    /**
     * Comma-separated list of invited supplier emails. Suppliers are only allowed to bid when
     * their account email appears on this list.
     */
    @Column(name = "invited_supplier_emails", columnDefinition = "TEXT")
    private String invitedSupplierEmails;

    @Column(name = "awarded_bid_id")
    private Long awardedBidId;

    @Column(name = "award_reason", columnDefinition = "TEXT")
    private String awardReason;

    @Column(name = "created_by", nullable = false, length = 255)
    private String createdBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "awarded_at")
    private LocalDateTime awardedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
