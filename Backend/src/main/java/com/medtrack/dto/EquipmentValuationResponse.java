package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Fleet valuation summary for the analytics dashboard: what the equipment is worth on the books,
 * what it cost, and what replacing it would cost today, plus per-category breakdowns and the most
 * valuable assets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentValuationResponse {

    private long assetCount;
    private long assetsWithCost;
    private long fullyDepreciatedCount;
    private BigDecimal totalPurchaseCost;
    private BigDecimal totalBookValue;
    private BigDecimal totalReplacementCost;
    private Map<String, BigDecimal> purchaseCostByCategory;
    private Map<String, BigDecimal> bookValueByCategory;
    private List<AssetValuation> topAssetsByBookValue;

    /** One asset's valuation figures, for the "most valuable" breakdown. */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetValuation {
        private Long id;
        private String name;
        private String department;
        private String equipmentCode;
        private BigDecimal purchaseCost;
        private BigDecimal bookValue;
        private BigDecimal projectedReplacementCost;
    }
}
