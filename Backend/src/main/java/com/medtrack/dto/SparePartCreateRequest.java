package com.medtrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SparePartCreateRequest {

    @NotBlank(message = "Part number is required")
    private String partNumber;

    @NotBlank(message = "Description is required")
    private String description;

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
}
