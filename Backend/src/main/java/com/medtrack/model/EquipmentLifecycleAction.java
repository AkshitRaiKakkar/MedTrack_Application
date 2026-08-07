package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_lifecycle_actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentLifecycleAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EquipmentLifecycleActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private EquipmentLifecycleStatus status = EquipmentLifecycleStatus.PENDING_APPROVAL;

    @Column(length = 255)
    private String previousDepartment;

    @Column(length = 255)
    private String newDepartment;
    @Column(length = 100)
    private String roomLocation;
    @Column(length = 100)
    private String wardLocation;
    @Column(length = 255)
    private String custodian;
    private LocalDate effectiveDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_equipment_id")
    private Equipment replacementEquipment;

    @Column(precision = 14, scale = 2)
    private BigDecimal depreciationAmount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 255)
    private String requestedBy;
    @Column(length = 255)
    private String approvedBy;
    @Column(length = 255)
    private String rejectedBy;
    @Column(columnDefinition = "TEXT")
    private String rejectedReason;
    @Column(length = 255)
    private String completedBy;
    @Column(length = 255)
    private String cancelledBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    @PrePersist
    void prePersist() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }
}
