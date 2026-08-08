package com.medtrack.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentFinancialRequest {

    @NotNull
    private Long equipmentId;

    @NotNull
    @Min(0)
    private Double purchaseCost;

    @NotNull
    @Min(1)
    private Integer usefulLifeYears;

    @NotNull
    @Min(0)
    private Double salvageValue;

    @Builder.Default
    private String depreciationMethod = "STRAIGHT_LINE";
}