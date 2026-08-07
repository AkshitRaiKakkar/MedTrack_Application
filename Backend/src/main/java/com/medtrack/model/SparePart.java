package com.medtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "spare_parts")
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SparePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @NotBlank(message = "Part number is required")
    @Column(nullable = false, length = 100)
    private String partNumber;

    @NotBlank(message = "Description is required")
    @Column(nullable = false, length = 255)
    private String description;

    @Column(length = 255)
    private String compatibleModels;

    @NotNull(message = "Stock level is required")
    @PositiveOrZero(message = "Stock level cannot be negative")
    private Integer stockLevel;

    @NotNull(message = "Reorder point is required")
    @PositiveOrZero(message = "Reorder point cannot be negative")
    private Integer reorderPoint;

    @NotNull(message = "Unit cost is required")
    @PositiveOrZero(message = "Unit cost cannot be negative")
    private Double unitCost;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 255)
    private String deletedBy;
}
