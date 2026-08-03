package com.medtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import com.medtrack.util.DepreciationCalculator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Equipment Entity - Matches frontend EquipmentList.jsx, AddEquipmentForm.jsx
 * API: GET  /api/equipment       - List all
 * API: GET  /api/equipment/{id}  - Get by ID
 * API: POST /api/equipment       - Add new
 * API: PUT  /api/equipment/{id}  - Update
 * API: POST /api/equipment/{id}/archive - Archive (soft delete)
 * API: GET  /api/equipment/archived - List archived (admin only)
 */
@Entity
@Table(name = "equipment")
// Hibernate 7 removed @Where; @SQLRestriction is its replacement and carries the same semantics.
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Displayed as "EQ-001" style in frontend.
     * equipmentCode stores the string ID like "EQ-001"
     */
    @Column(unique = true)
    private String equipmentCode;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String model;

    private String serialNumber;

    @NotBlank
    @Column(nullable = false)
    private String department;

    /**
     * Status values: ACTIVE, UNDER_MAINTENANCE, RETIRED
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EquipmentStatus status = EquipmentStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    private EquipmentCategory category;

    /**
     * Units of this asset currently held by the owning hospital.
     *
     * <p>Modelled as {@link Integer} rather than {@code int} deliberately. A primitive would
     * deserialise an omitted JSON property as {@code 0}, so a {@code PUT /api/equipment/{id}} that
     * did not mention stock would silently zero it. The service can only distinguish
     * "not supplied" from "set to zero" if the field is nullable in transit.</p>
     */
    @PositiveOrZero(message = "Quantity cannot be negative")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    /**
     * Reorder threshold. An asset is reported by {@code GET /api/equipment/low-stock} once
     * {@code quantity <= minimumStock}.
     *
     * <p>The default of 10 matches the value {@code EquipmentService.addEquipment} already applied
     * when a caller omitted the field.</p>
     */
    @PositiveOrZero(message = "Minimum stock cannot be negative")
    @Column(nullable = false)
    @Builder.Default
    private Integer minimumStock = 10;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiry;

    // ---------------------------------------------------------------------
    // Depreciation & valuation fields
    //
    // The three stored fields are entered at registration; the value the finance team cares
    // about - book value, accumulated depreciation, replacement cost - is derived on read by the
    // @Transient getters below and serialised into every JSON response alongside the entity.
    // ---------------------------------------------------------------------

    /**
     * Purchase price of the asset. {@code null} means the finance fields were never filled in,
     * in which case no depreciation accrues and the book value equals the cost (or zero).
     */
    @Column(name = "purchase_cost", precision = 14, scale = 2)
    private BigDecimal purchaseCost;

    /**
     * Depreciable life of the asset in years. {@code null} (or &le; 0) means no depreciation.
     */
    @Column(name = "useful_life_years")
    private Integer usefulLifeYears;

    /**
     * Depreciation method; straight line by default. Stored as an enum constant so the import and
     * export can round-trip it unambiguously.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "depreciation_method", length = 30)
    @Builder.Default
    private DepreciationMethod depreciationMethod = DepreciationMethod.STRAIGHT_LINE;

    /**
     * Current book value (purchase cost minus accumulated depreciation, floored at 0), computed
     * as of today. Never persisted; serialised by Jackson for every read of this entity.
     */
    @Transient
    public BigDecimal getBookValue() {
        return DepreciationCalculator.bookValue(
                purchaseCost, purchaseDate, usefulLifeYears, depreciationMethod, LocalDate.now());
    }

    /**
     * Depreciation recognised to date. Never persisted; serialised with the entity.
     */
    @Transient
    public BigDecimal getAccumulatedDepreciation() {
        BigDecimal cost = purchaseCost;
        if (cost == null) {
            return null;
        }
        BigDecimal value = getBookValue();
        return value == null ? null : cost.subtract(value).max(BigDecimal.ZERO);
    }

    /**
     * Projected cost of replacing this asset today, compounding the purchase price at the medical
     * equipment inflation rate since acquisition. Never persisted; serialised with the entity.
     */
    @Transient
    public BigDecimal getProjectedReplacementCost() {
        return DepreciationCalculator.projectedReplacementCost(
                purchaseCost, purchaseDate, LocalDate.now());
    }

    @Column(name = "room_location", length = 100)
    private String roomLocation;

    @Column(name = "ward_location", length = 100)
    private String wardLocation;

    @Column(name = "custodian", length = 255)
    private String custodian;

    @Column(name = "location_effective_date")
    private LocalDate locationEffectiveDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_equipment_id")
    private Equipment replacementEquipment;

    /**
     * Many Equipment items belong to one Hospital.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    /**
     * Soft delete fields - records are never hard deleted for audit compliance
     */
    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 255)
    private String deletedBy;
}
