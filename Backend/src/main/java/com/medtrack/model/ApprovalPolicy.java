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
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A configurable approval policy. A policy selects which requests it governs via a set of
 * matching criteria (amount band, category, urgency, requester role) and is evaluated
 * deterministically: the first active policy whose criteria match wins.
 */
@Entity
@Table(name = "approval_policies")
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String description;

    // Criteria used for deterministic evaluation; null/0 means "any".
    @Column(name = "min_amount", precision = 14, scale = 2)
    private BigDecimal minAmount;
    @Column(name = "max_amount", precision = 14, scale = 2)
    private BigDecimal maxAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private EquipmentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProcurementUrgency urgency;

    @Column(name = "requester_role", length = 50)
    private String requesterRole;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
