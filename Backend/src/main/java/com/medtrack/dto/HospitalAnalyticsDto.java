package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalAnalyticsDto {
    private BigDecimal totalSpend;
    private Map<String, BigDecimal> spendByCategory;
    private double slaComplianceRate;
    private double meanTimeToRepairHours;
    private long criticalFailingAssetsCount;
    private double downtimePercentage;
    private long upcomingWarrantyExpirationsCount;
    // Fleet valuation (issue #702): what the equipment fleet is worth, at cost and on the books.
    private BigDecimal fleetPurchaseCost;
    private BigDecimal fleetBookValue;
    private BigDecimal fleetReplacementCost;
    private Map<String, BigDecimal> bookValueByCategory;
    private long fullyDepreciatedCount;
}
