package com.medtrack.supplier.mapper;

import com.medtrack.supplier.dto.DelayAnalytics;
import com.medtrack.supplier.dto.ShipmentStatistics;
import com.medtrack.supplier.dto.SupplierPerformance;
import com.medtrack.supplier.dto.SupplierPerformanceResponse;
import org.springframework.stereotype.Component;

@Component
public class DashboardMapper {

    public ShipmentStatistics toShipmentStatistics(SupplierPerformanceResponse metrics, double avgDays) {
        return ShipmentStatistics.builder()
                .totalShipments(metrics.getTotalShipments())
                .successRate(metrics.getOnTimeDeliveryRate())
                .averageDeliveryTimeDays(avgDays)
                .build();
    }

    public SupplierPerformance toSupplierPerformance(SupplierPerformanceResponse metrics, String rating) {
        return SupplierPerformance.builder()
                .performanceScore(metrics.getPerformanceScore())
                .rating(rating)
                .build();
    }

    public DelayAnalytics toDelayAnalytics(SupplierPerformanceResponse metrics, double delayPercentage) {
        return DelayAnalytics.builder()
                .totalDelayedShipments(metrics.getDelayedShipments())
                .delayPercentage(delayPercentage)
                .build();
    }
}
