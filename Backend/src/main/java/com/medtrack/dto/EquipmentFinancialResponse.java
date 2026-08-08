package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentFinancialResponse {

    private Long equipmentId;

    private String equipmentCode;

    private String equipmentName;

    private String department;

    private String category;

    private Double purchaseCost;

    private Double currentValue;

    private Double depreciationAmount;

    private Double depreciationPercentage;

    private Integer usefulLifeYears;

    private Integer remainingUsefulLife;

    private Double salvageValue;

    private String depreciationMethod;

    private LocalDate purchaseDate;

}