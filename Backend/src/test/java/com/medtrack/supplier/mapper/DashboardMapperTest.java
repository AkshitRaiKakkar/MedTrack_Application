package com.medtrack.supplier.mapper;

import com.medtrack.supplier.dto.DelayAnalytics;
import com.medtrack.supplier.dto.ShipmentStatistics;
import com.medtrack.supplier.dto.SupplierPerformance;
import com.medtrack.supplier.dto.SupplierPerformanceResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardMapperTest {

    private final DashboardMapper mapper = new DashboardMapper();

    @Test
    void testToShipmentStatistics() {
        SupplierPerformanceResponse metrics = SupplierPerformanceResponse.builder()
                .totalShipments(100)
                .onTimeDeliveryRate(85.5)
                .build();

        ShipmentStatistics result = mapper.toShipmentStatistics(metrics, 2.5);

        assertEquals(100, result.getTotalShipments());
        assertEquals(85.5, result.getSuccessRate());
        assertEquals(2.5, result.getAverageDeliveryTimeDays());
    }

    @Test
    void testToSupplierPerformance() {
        SupplierPerformanceResponse metrics = SupplierPerformanceResponse.builder()
                .performanceScore(92.0)
                .build();

        SupplierPerformance result = mapper.toSupplierPerformance(metrics, "EXCELLENT");

        assertEquals(92.0, result.getPerformanceScore());
        assertEquals("EXCELLENT", result.getRating());
    }

    @Test
    void testToDelayAnalytics() {
        SupplierPerformanceResponse metrics = SupplierPerformanceResponse.builder()
                .delayedShipments(15)
                .build();

        DelayAnalytics result = mapper.toDelayAnalytics(metrics, 15.0);

        assertEquals(15, result.getTotalDelayedShipments());
        assertEquals(15.0, result.getDelayPercentage());
    }
}
