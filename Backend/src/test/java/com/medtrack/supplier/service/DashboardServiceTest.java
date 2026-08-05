package com.medtrack.supplier.service;

import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.dto.DashboardResponse;
import com.medtrack.supplier.dto.DashboardSummary;
import com.medtrack.supplier.dto.SupplierPerformanceResponse;
import com.medtrack.supplier.mapper.DashboardMapper;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

        @Mock
        private EquipmentOrderRepository equipmentOrderRepository;

        @Mock
        private ShipmentTrackingRepository shipmentTrackingRepository;

        @Mock
        private SupplierPerformanceService supplierPerformanceService;

        @Mock
        private DashboardMapper dashboardMapper;

        @InjectMocks
        private DashboardService dashboardService;

        @BeforeEach
        void setUp() {
        }

        @Test
        void testGetSummary() {
                Long supplierId = 1L;
                when(equipmentOrderRepository.countTotalOrdersBySupplierId(supplierId)).thenReturn(50L);
                when(equipmentOrderRepository.countOrdersByStatusAndSupplierId("PENDING", supplierId)).thenReturn(10L);
                when(equipmentOrderRepository.countOrdersByStatusAndSupplierId("CONFIRMED", supplierId)).thenReturn(5L);
                when(equipmentOrderRepository.countOrdersByStatusAndSupplierId("SHIPPED", supplierId)).thenReturn(15L);
                when(equipmentOrderRepository.countOrdersByStatusAndSupplierId("DELIVERED", supplierId))
                                .thenReturn(20L);

                DashboardSummary summary = dashboardService.getSummary(supplierId);

                assertNotNull(summary);
                assertEquals(50L, summary.getTotalOrders());
                assertEquals(30L, summary.getActiveOrders()); // 10 + 5 + 15
                assertEquals(10L, summary.getPendingOrders());
                assertEquals(5L, summary.getConfirmedOrders());
                assertEquals(15L, summary.getShippedOrders());
                assertEquals(20L, summary.getDeliveredOrders());
        }

        @Test
        void testGetDashboard() {
                Long supplierId = 1L;
                when(equipmentOrderRepository.countTotalOrdersBySupplierId(supplierId)).thenReturn(50L);

                SupplierPerformanceResponse metrics = SupplierPerformanceResponse.builder()
                                .supplierId(supplierId)
                                .totalShipments(20L)
                                .delayedShipments(2L)
                                .onTimeDeliveryRate(90.0)
                                .performanceScore(85.0)
                                .build();

                when(supplierPerformanceService.getPerformance(supplierId)).thenReturn(metrics);
                when(shipmentTrackingRepository.getAverageDeliveryTimeDays(supplierId)).thenReturn(3.5);

                when(dashboardMapper.toShipmentStatistics(any(), anyDouble()))
                                .thenReturn(com.medtrack.supplier.dto.ShipmentStatistics.builder().build());
                when(dashboardMapper.toSupplierPerformance(any(), any()))
                                .thenReturn(com.medtrack.supplier.dto.SupplierPerformance.builder().build());
                when(dashboardMapper.toDelayAnalytics(any(), anyDouble()))
                                .thenReturn(com.medtrack.supplier.dto.DelayAnalytics.builder().build());

                DashboardResponse response = dashboardService.getDashboard(supplierId);

                assertNotNull(response);
                assertNotNull(response.getSummary());
                assertNotNull(response.getShipmentStatistics());
                assertNotNull(response.getSupplierPerformance());
                assertNotNull(response.getDelayAnalytics());
                assertNotNull(response.getMonthlyReports());
        }

        @Test
        void testGetMonthlyReports() {
                Long supplierId = 1L;
                com.medtrack.supplier.model.ShipmentTracking tracking1 = com.medtrack.supplier.model.ShipmentTracking
                                .builder()
                                .supplierId(supplierId)
                                .shipmentStatus(com.medtrack.supplier.model.ShipmentStatus.DELIVERED)
                                .delayDetected(false).createdAt(java.time.LocalDateTime.of(2023, 1, 15, 10, 0)).build();
                com.medtrack.supplier.model.ShipmentTracking tracking2 = com.medtrack.supplier.model.ShipmentTracking
                                .builder()
                                .supplierId(supplierId)
                                .shipmentStatus(com.medtrack.supplier.model.ShipmentStatus.SHIPPED)
                                .delayDetected(true).createdAt(java.time.LocalDateTime.of(2023, 1, 20, 10, 0)).build();

                when(shipmentTrackingRepository.findBySupplierId(supplierId))
                                .thenReturn(java.util.Arrays.asList(tracking1, tracking2));

                java.util.List<com.medtrack.supplier.dto.MonthlyShipmentReport> reports = dashboardService
                                .getMonthlyReports(supplierId);

                assertNotNull(reports);
                assertEquals(1, reports.size());
                assertEquals("2023-01", reports.get(0).getMonth());
                assertEquals(2, reports.get(0).getTotalShipments());
                assertEquals(1, reports.get(0).getSuccessfulShipments());
                assertEquals(1, reports.get(0).getDelayedShipments());
        }

        @Test
        void testGetStatusDistribution() {
                Long supplierId = 1L;
                com.medtrack.supplier.model.ShipmentTracking tracking1 = com.medtrack.supplier.model.ShipmentTracking
                                .builder()
                                .supplierId(supplierId)
                                .shipmentStatus(com.medtrack.supplier.model.ShipmentStatus.DELIVERED).build();
                com.medtrack.supplier.model.ShipmentTracking tracking2 = com.medtrack.supplier.model.ShipmentTracking
                                .builder()
                                .supplierId(supplierId)
                                .shipmentStatus(com.medtrack.supplier.model.ShipmentStatus.SHIPPED).build();

                when(shipmentTrackingRepository.findBySupplierId(supplierId))
                                .thenReturn(java.util.Arrays.asList(tracking1, tracking2));

                java.util.Map<String, Long> dist = dashboardService.getStatusDistribution(supplierId);

                assertNotNull(dist);
                assertEquals(2, dist.size());
                assertEquals(1L, dist.get("DELIVERED"));
                assertEquals(1L, dist.get("SHIPPED"));
        }

        @Test
        void testGetDelayedShipmentsReport() {
                Long supplierId = 1L;
                com.medtrack.supplier.model.ShipmentTracking delayed = com.medtrack.supplier.model.ShipmentTracking
                                .builder()
                                .id(100L).supplierId(supplierId)
                                .shipmentStatus(com.medtrack.supplier.model.ShipmentStatus.SHIPPED)
                                .shipmentTrackingNumber("D-123").delayDetected(true).build();

                when(shipmentTrackingRepository.findBySupplierIdAndDelayDetectedTrue(supplierId))
                                .thenReturn(java.util.Collections.singletonList(delayed));

                java.util.List<com.medtrack.supplier.dto.ShipmentTrackingResponse> list = dashboardService
                                .getDelayedShipmentsReport(supplierId);

                assertNotNull(list);
                assertEquals(1, list.size());
                assertEquals("D-123", list.get(0).getShipmentTrackingNumber());
        }
}
