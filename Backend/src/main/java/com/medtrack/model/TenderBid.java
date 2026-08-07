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
 * A supplier's bid in a given tender round.
 *
 * <p>Carries the commercial (price, lead time) and qualitative (quality score, delivery
 * performance) dimensions the hospital compares side by side when awarding the tender.</p>
 */
@Entity
@Table(name = "tender_bids")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderBid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tender_id", nullable = false)
    private Long tenderId;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;
    @Column(name = "supplier_name", nullable = false, length = 255)
    private String supplierName;
    @Column(name = "supplier_email", nullable = false, length = 255)
    private String supplierEmail;

    @Column(name = "bid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal bidAmount;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "delivery_score")
    private Integer deliveryScore;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TenderBidStatus status = TenderBidStatus.SUBMITTED;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
}
