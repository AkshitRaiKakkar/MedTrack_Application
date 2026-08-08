package com.medtrack.supplier.service.scheduler;

import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.service.SupplierPerformanceService;
import com.medtrack.supplier.service.DeliveryDelayDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;

/**
 * Phase 13 - Automation Scheduler
 * Orchestrates automated backend operational tasks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierAutomationScheduler {

    private final SupplierPerformanceService supplierPerformanceService;
    private final DeliveryDelayDetectionService deliveryDelayDetectionService;
    private final ShipmentTrackingRepository shipmentTrackingRepository;

    /**
     * Nightly job to forcefully recalculate performance score for all suppliers
     * in case of cache irregularities or retro-active delay event detections.
     * Runs at 02:00 AM every day by default.
     */
    @Scheduled(cron = "${app.supplier.automation.performance-cron:0 0 2 * * ?}")
    public void scheduledPerformanceRecalculation() {
        log.info("Starting scheduled performance recalculation for all active suppliers.");
        try {
            List<Long> supplierIds = shipmentTrackingRepository.findDistinctSupplierIds();
            for (Long id : supplierIds) {
                supplierPerformanceService.publishPerformanceUpdate(id);
            }
            log.info("Finished scheduled performance recalculation for {} suppliers.", supplierIds.size());
        } catch (Exception e) {
            log.error("Failed to run scheduled performance recalculation", e);
        }
    }

    /**
     * Additional nightly task or fallback scan to ensure no shipment delays were
     * missed
     * by the primary fast-polling scanner if the service was down.
     * Usually runs after performance recalculation.
     */
    @Scheduled(cron = "${app.supplier.automation.delay-scan-cron:0 30 2 * * ?}")
    public void scheduledDelayedShipmentScan() {
        log.info("Starting scheduled fallback delayed shipment scan.");
        try {
            deliveryDelayDetectionService.detectDelays();
            log.info("Finished scheduled fallback delayed shipment scan.");
        } catch (Exception e) {
            log.error("Failed to run delayed shipment scan", e);
        }
    }

    /**
     * Periodically refresh the dashboard cache to prevent stale data.
     */
    @Scheduled(fixedRateString = "${app.supplier.automation.cache-refresh-ms:3600000}")
    @CacheEvict(value = "supplierDashboard", allEntries = true)
    public void scheduledDashboardCacheRefresh() {
        log.info("Evicted supplierDashboard cache.");
    }
}
