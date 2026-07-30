package com.medtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
@Where(clause = "deleted = false")
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