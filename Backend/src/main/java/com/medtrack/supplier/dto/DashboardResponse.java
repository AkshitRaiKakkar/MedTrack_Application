package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private DashboardSummary summary;
    private ShipmentStatistics shipmentStatistics;
    private SupplierPerformance supplierPerformance;
    private DelayAnalytics delayAnalytics;
    private List<MonthlyShipmentReport> monthlyReports;
}
