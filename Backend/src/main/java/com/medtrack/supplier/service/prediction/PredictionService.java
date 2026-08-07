package com.medtrack.supplier.service.prediction;

import com.medtrack.supplier.dto.PredictionDTO;
import com.medtrack.supplier.dto.ShipmentRiskDTO;
import com.medtrack.supplier.dto.TrendAnalysisDTO;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final ShipmentTrackingRepository shipmentTrackingRepository;

    @Transactional(readOnly = true)
    public PredictionDTO getDailyForecast(Long supplierId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        long recentShipments = shipmentTrackingRepository.countShipmentsBySupplierAndDateRange(supplierId,
                thirtyDaysAgo, now);
        double dailyAvg = recentShipments / 30.0;

        return PredictionDTO.builder()
                .category("DAILY_FORECAST")
                .predictionDate(LocalDate.now())
                .value(dailyAvg)
                .description("Estimated daily shipment volume based on last 30 days")
                .build();
    }

    @Transactional(readOnly = true)
    public PredictionDTO getWeeklyForecast(Long supplierId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twelveWeeksAgo = now.minusWeeks(12);

        long recentShipments = shipmentTrackingRepository.countShipmentsBySupplierAndDateRange(supplierId,
                twelveWeeksAgo, now);
        double weeklyAvg = recentShipments / 12.0;

        return PredictionDTO.builder()
                .category("WEEKLY_FORECAST")
                .predictionDate(LocalDate.now())
                .value(weeklyAvg)
                .description("Estimated weekly shipment volume based on last 12 weeks")
                .build();
    }

    @Transactional(readOnly = true)
    public PredictionDTO getDelayProbability(Long supplierId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeMonthsAgo = now.minusMonths(3);

        long totalShipments = shipmentTrackingRepository.countShipmentsBySupplierAndDateRange(supplierId,
                threeMonthsAgo, now);
        long delayedShipments = shipmentTrackingRepository.countDelayedShipmentsBySupplierAndDateRange(supplierId,
                threeMonthsAgo, now);

        double probability = totalShipments > 0 ? ((double) delayedShipments / totalShipments) * 100 : 0.0;

        return PredictionDTO.builder()
                .category("DELAY_PROBABILITY")
                .predictionDate(LocalDate.now())
                .value(probability)
                .description("Probability of a shipment being delayed based on recent performance")
                .build();
    }

    @Transactional(readOnly = true)
    public ShipmentRiskDTO calculateShipmentRisk(Long supplierId, Long orderId) {
        Optional<ShipmentTracking> shipmentOpt = shipmentTrackingRepository.findByOrderId(orderId);

        if (shipmentOpt.isEmpty()) {
            return generateDefaultRisk(orderId, "No shipment details found");
        }

        ShipmentTracking shipment = shipmentOpt.get();

        if (shipment.getShipmentStatus() == ShipmentStatus.DELIVERED) {
            return generateRisk(orderId, shipment.getShipmentTrackingNumber(), "LOW", 0.0, "Delivered");
        }

        double riskScore = 0.0;
        String riskFactor = "Normal";

        if (shipment.isDelayDetected()) {
            riskScore += 50.0;
            riskFactor = "Delay Already Detected";
        }

        PredictionDTO delayProb = getDelayProbability(supplierId);
        if (delayProb.getValue() > 20.0 && riskScore < 50.0) {
            riskScore += delayProb.getValue();
            riskFactor = "Supplier has high overall delay rate";
        }

        if (shipment.getEstimatedDeliveryDate() != null) {
            long daysToDelivery = ChronoUnit.DAYS.between(LocalDateTime.now(), shipment.getEstimatedDeliveryDate());
            if (daysToDelivery < 2 && shipment.getShipmentStatus() == ShipmentStatus.IN_TRANSIT) {
                riskScore += 30.0;
                riskFactor = "Close to delivery date but still in transit";
            }
        }

        riskScore = Math.min(riskScore, 100.0);
        String riskLevel = determineRiskLevel(riskScore);

        return generateRisk(orderId, shipment.getShipmentTrackingNumber(), riskLevel, riskScore, riskFactor);
    }

    @Transactional(readOnly = true)
    public TrendAnalysisDTO getTrendAnalysis(Long supplierId) {
        List<ShipmentTracking> shipments = shipmentTrackingRepository.findBySupplierId(supplierId);

        Map<String, Double> performanceHistory = new TreeMap<>();
        Map<String, Integer> delayHistory = new TreeMap<>();
        Map<String, Integer> shipmentVolumeHistory = new TreeMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (ShipmentTracking st : shipments) {
            String month = YearMonth.from(st.getCreatedAt()).format(formatter);
            shipmentVolumeHistory.put(month, shipmentVolumeHistory.getOrDefault(month, 0) + 1);
            if (st.isDelayDetected()) {
                delayHistory.put(month, delayHistory.getOrDefault(month, 0) + 1);
            }
            if (st.getShipmentStatus() == ShipmentStatus.DELIVERED && st.getActualDeliveryDate() != null) {
                long daysTaken = ChronoUnit.DAYS.between(st.getCreatedAt(), st.getActualDeliveryDate());
                // For simplicity, we are just accumulating total days, we'll average below
                performanceHistory.put(month, performanceHistory.getOrDefault(month, 0.0) + daysTaken);
            }
        }

        // Average the performance history
        for (String month : performanceHistory.keySet()) {
            int volumeForMonth = shipmentVolumeHistory.getOrDefault(month, 1);
            performanceHistory.put(month, performanceHistory.get(month) / volumeForMonth);
        }

        return TrendAnalysisDTO.builder()
                .supplierId(supplierId)
                .performanceHistory(performanceHistory)
                .delayHistory(delayHistory)
                .shipmentVolumeHistory(shipmentVolumeHistory)
                .build();
    }

    private ShipmentRiskDTO generateDefaultRisk(Long orderId, String factor) {
        return generateRisk(orderId, null, "UNKNOWN", 0.0, factor);
    }

    private ShipmentRiskDTO generateRisk(Long orderId, String tracking, String level, Double score, String factor) {
        return ShipmentRiskDTO.builder()
                .orderId(orderId)
                .trackingNumber(tracking)
                .riskLevel(level)
                .riskScore(score)
                .riskFactor(factor)
                .build();
    }

    private String determineRiskLevel(double score) {
        if (score >= 80)
            return "CRITICAL";
        if (score >= 50)
            return "HIGH";
        if (score >= 20)
            return "MEDIUM";
        return "LOW";
    }
}
