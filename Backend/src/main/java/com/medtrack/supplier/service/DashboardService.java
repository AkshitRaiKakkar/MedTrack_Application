package com.medtrack.supplier.service;

import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.dto.*;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medtrack.supplier.mapper.DashboardMapper;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EquipmentOrderRepository equipmentOrderRepository;
    private final ShipmentTrackingRepository shipmentTrackingRepository;
    private final SupplierPerformanceService supplierPerformanceService;
    private final DashboardMapper dashboardMapper;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long supplierId) {
        DashboardSummary summary = getSummary(supplierId);
        SupplierPerformanceResponse metrics = supplierPerformanceService.getPerformance(supplierId);

        ShipmentStatistics shipmentStatistics = dashboardMapper.toShipmentStatistics(metrics,
                getAverageDeliveryTimeDays(supplierId));
        SupplierPerformance supplierPerformance = dashboardMapper.toSupplierPerformance(metrics,
                determineRating(metrics.getPerformanceScore()));

        double delayPercentage = metrics.getTotalShipments() > 0
                ? (double) metrics.getDelayedShipments() / metrics.getTotalShipments() * 100
                : 0.0;

        DelayAnalytics delayAnalytics = dashboardMapper.toDelayAnalytics(metrics, delayPercentage);

        return DashboardResponse.builder()
                .summary(summary)
                .shipmentStatistics(shipmentStatistics)
                .supplierPerformance(supplierPerformance)
                .delayAnalytics(delayAnalytics)
                .monthlyReports(getMonthlyReports(supplierId))
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardSummary getSummary(Long supplierId) {
        long totalOrders = equipmentOrderRepository.countTotalOrdersBySupplierId(supplierId);
        long pendingOrders = equipmentOrderRepository.countOrdersByStatusAndSupplierId("PENDING", supplierId);
        long confirmedOrders = equipmentOrderRepository.countOrdersByStatusAndSupplierId("CONFIRMED", supplierId);
        long shippedOrders = equipmentOrderRepository.countOrdersByStatusAndSupplierId("SHIPPED", supplierId);
        long deliveredOrders = equipmentOrderRepository.countOrdersByStatusAndSupplierId("DELIVERED", supplierId);
        long activeOrders = pendingOrders + confirmedOrders + shippedOrders;

        return DashboardSummary.builder()
                .totalOrders(totalOrders)
                .activeOrders(activeOrders)
                .pendingOrders(pendingOrders)
                .confirmedOrders(confirmedOrders)
                .shippedOrders(shippedOrders)
                .deliveredOrders(deliveredOrders)
                .build();
    }

    @Transactional(readOnly = true)
    public SupplierPerformance getPerformanceScore(Long supplierId) {
        SupplierPerformanceResponse metrics = supplierPerformanceService.getPerformance(supplierId);
        return SupplierPerformance.builder()
                .performanceScore(metrics.getPerformanceScore())
                .rating(determineRating(metrics.getPerformanceScore()))
                .build();
    }

    private Double getAverageDeliveryTimeDays(Long supplierId) {
        Double avg = shipmentTrackingRepository.getAverageDeliveryTimeDays(supplierId);
        return avg != null ? avg : 0.0;
    }

    private String determineRating(double score) {
        if (score >= 90)
            return "EXCELLENT";
        if (score >= 70)
            return "GOOD";
        if (score >= 50)
            return "FAIR";
        return "POOR";
    }

    @Transactional(readOnly = true)
    public List<MonthlyShipmentReport> getMonthlyReports(Long supplierId) {
        List<com.medtrack.supplier.model.ShipmentTracking> shipments = shipmentTrackingRepository
                .findBySupplierId(supplierId);
        java.util.Map<String, MonthlyShipmentReport> monthMap = new java.util.TreeMap<>();

        for (com.medtrack.supplier.model.ShipmentTracking st : shipments) {
            String month = st.getCreatedAt().getYear() + "-" + String.format("%02d", st.getCreatedAt().getMonthValue());
            MonthlyShipmentReport report = monthMap.computeIfAbsent(month, k -> MonthlyShipmentReport.builder()
                    .month(k)
                    .totalShipments(0)
                    .successfulShipments(0)
                    .delayedShipments(0)
                    .build());

            report.setTotalShipments(report.getTotalShipments() + 1);
            if (st.getShipmentStatus() == ShipmentStatus.DELIVERED) {
                report.setSuccessfulShipments(report.getSuccessfulShipments() + 1);
            }
            if (st.isDelayDetected()) {
                report.setDelayedShipments(report.getDelayedShipments() + 1);
            }
        }
        return new ArrayList<>(monthMap.values());
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getStatusDistribution(Long supplierId) {
        List<com.medtrack.supplier.model.ShipmentTracking> shipments = shipmentTrackingRepository
                .findBySupplierId(supplierId);
        java.util.Map<String, Long> distribution = new java.util.HashMap<>();
        for (com.medtrack.supplier.model.ShipmentTracking st : shipments) {
            String status = st.getShipmentStatus().name();
            distribution.put(status, distribution.getOrDefault(status, 0L) + 1);
        }
        return distribution;
    }

    @Transactional(readOnly = true)
    public List<ShipmentTrackingResponse> getDelayedShipmentsReport(Long supplierId) {
        return shipmentTrackingRepository.findBySupplierIdAndDelayDetectedTrue(supplierId).stream()
                .map(s -> ShipmentTrackingResponse.builder()
                        .id(s.getId())
                        .orderId(s.getOrderId())
                        .shipmentTrackingNumber(s.getShipmentTrackingNumber())
                        .estimatedDeliveryDate(s.getEstimatedDeliveryDate())
                        .actualDeliveryDate(s.getActualDeliveryDate())
                        .shipmentStatus(s.getShipmentStatus().name())
                        .supplierId(s.getSupplierId())
                        .createdAt(s.getCreatedAt())
                        .updatedAt(s.getUpdatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }
}
