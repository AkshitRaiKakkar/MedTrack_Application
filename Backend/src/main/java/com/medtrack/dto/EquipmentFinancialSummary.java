package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentFinancialSummary {

    private Double totalAssetValue;

    private Double currentAssetValue;

    private Double totalDepreciation;

    private Double averageDepreciation;

    private Long totalEquipment;

    private Long replacementRecommended;

}