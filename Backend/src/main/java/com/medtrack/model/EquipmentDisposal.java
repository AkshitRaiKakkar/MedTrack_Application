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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Decommissioning / disposal workflow record (issue #744).
 *
 * <p>Assets are never silently deleted. A staff member records the disposal reason and method
 * (sale, scrap, donation, return to vendor), a manager must approve it, and devices that stored
 * patient or operational data need a confirmed data-sanitisation step before the asset can be
 * retired. On completion the asset moves to {@link EquipmentStatus#DISPOSED}, a certificate
 * number is minted, and the record - with its full history - stays searchable in the retired
 * assets view.</p>
 */
@Entity
@Table(name = "equipment_disposals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDisposal {

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
    @Column(nullable = false, length = 40)
    private EquipmentDisposalMethod disposalMethod;

    @Column(columnDefinition = "TEXT")
    private String disposalReason;

    private LocalDate effectiveDate;

    /**
     * Whether the device ever stored patient or operational data (e.g. an imaging console, a
     * bedside monitor, a lab analyser with a hard drive). Such devices require the
     * data-sanitisation confirmation step below before the disposal may be completed.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean storesPatientData = false;

    /**
     * Confirmed by the staff member who carried out the wipe / removal. {@code true} is only
     * possible via {@code POST /api/equipment/disposals/{id}/data-sanitization}, which stamps the
     * actor and timestamp.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean dataSanitizationConfirmed = false;

    @Column(columnDefinition = "TEXT")
    private String dataSanitizationDetails;

    private LocalDateTime dataSanitizedAt;
    @Column(length = 255)
    private String dataSanitizedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private EquipmentDisposalStatus status = EquipmentDisposalStatus.PENDING_APPROVAL;

    /**
     * Certificate number minted at completion, e.g. {@code DSP-2026-000123}. Null until the
     * disposal is completed; the PDF certificate is only generated for completed records.
     */
    @Column(length = 40)
    private String certificateNumber;

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
