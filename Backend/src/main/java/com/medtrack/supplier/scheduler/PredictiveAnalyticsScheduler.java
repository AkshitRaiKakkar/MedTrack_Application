package com.medtrack.supplier.scheduler;

import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.service.prediction.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PredictiveAnalyticsScheduler {

    private final ShipmentTrackingRepository shipmentTrackingRepository;
    private final PredictionService predictionService;

    // Run every day at 1:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void generateDailyForecasts() {
        log.info("Starting daily predictive analytics refresh...");

        List<Long> supplierIds = shipmentTrackingRepository.findDistinctSupplierIds();

        for (Long supplierId : supplierIds) {
            try {
                predictionService.getDailyForecast(supplierId);
                predictionService.getDelayProbability(supplierId);
                predictionService.getTrendAnalysis(supplierId);
                log.info("Refreshed daily predictive metrics for supplier ID: {}", supplierId);
            } catch (Exception e) {
                log.error("Failed to refresh predictive metrics for supplier ID: {}", supplierId, e);
            }
        }

        log.info("Completed daily predictive analytics refresh.");
    }

    // Run every Sunday at 2:00 AM
    @Scheduled(cron = "0 0 2 ? * SUN")
    @Transactional
    public void generateWeeklyForecasts() {
        log.info("Starting weekly predictive analytics refresh...");

        List<Long> supplierIds = shipmentTrackingRepository.findDistinctSupplierIds();

        for (Long supplierId : supplierIds) {
            try {
                predictionService.getWeeklyForecast(supplierId);
                log.info("Refreshed weekly predictive metrics for supplier ID: {}", supplierId);
            } catch (Exception e) {
                log.error("Failed to refresh weekly predictive metrics for supplier ID: {}", supplierId, e);
            }
        }

        log.info("Completed weekly predictive analytics refresh.");
    }

    // Clear dashboard and prediction caches daily at 3:00 AM
    @Scheduled(cron = "0 0 3 * * ?")
    @CacheEvict(value = "supplierDashboard", allEntries = true)
    public void evictDashboardCache() {
        log.info("Evicted supplierDashboard cache.");
    }
}
