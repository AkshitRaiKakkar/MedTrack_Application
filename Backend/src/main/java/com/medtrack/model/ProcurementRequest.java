package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A procurement request is the auditable request stage of a purchase lifecycle, distinct from the
 * finalized {@link EquipmentOrder}. A request carries the requester's intent, a reserved budget,
 * and a workflow status that advances through approval, quoting, ordering, receiving, and invoice
 * reconciliation.
 */
@Entity
@Table(name = "procurement_requests",
        uniqueConstraints = @UniqueConstraint(name = "uk_procurement_request_code", columnNames = "request_code"))
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable tracking code, e.g. {@code PR-2026-0042}. */
    @Column(name = "request_code", nullable = false, unique = true, length = 50)
    private String requestCode;

    // Stable ownership key used by the service to isolate one hospital's requests from another.
    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    // Cached requester identity so the approval trail survives account changes.
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;
    @Column(name = "requester_name", nullable = false, length = 255)
    private String requesterName;
    @Column(name = "requester_email", nullable = false, length = 255)
    private String requesterEmail;

    // What is being procured, snapshot at request time.
    @Column(name = "equipment_code", nullable = false, length = 100)
    private String equipmentCode;
    @Column(name = "equipment_name", nullable = false, length = 255)
    private String equipmentName;
    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;
    @Column(name = "total_cost", precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ProcurementRequestStatus status = ProcurementRequestStatus.REQUESTED;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProcurementUrgency urgency;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private EquipmentCategory category;

    // Budget gate: the amount reserved while the request is pending.
    @Column(name = "budget_reserved", precision = 14, scale = 2)
    private BigDecimal budgetReserved;

    // Link to the finalized order once the request has been ordered.
    @Column(name = "order_id")
    private Long orderId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // SLA of the approval workflow: when the request must reach a decision.
    @Column(name = "approval_due_at")
    private LocalDateTime approvalDueAt;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;
    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
    @Column(name = "decided_by", length = 255)
    private String decidedBy;

    /**
     * Soft delete fields - records are never hard deleted for audit compliance.
     */
    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    @Column(name = "deleted_by", length = 255)
    private String deletedBy;
}
