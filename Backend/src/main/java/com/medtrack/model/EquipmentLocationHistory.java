package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * An audit record of an asset being placed at (or moved within) a facility location (issue #745).
 *
 * <p>Every assignment creates a row here; the asset's current location lives on
 * {@link Equipment#getLocation()}. Newest-first is the natural read order, so the repository
 * orders by {@code created_at} descending.</p>
 */
@Entity
@Table(name = "equipment_location_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentLocationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private FacilityLocation location;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "moved_by", length = 255)
    private String movedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}