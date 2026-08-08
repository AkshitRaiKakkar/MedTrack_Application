package com.medtrack.supplier.service.prediction;

import com.medtrack.supplier.dto.PredictionDTO;
import com.medtrack.supplier.dto.RecommendationDTO;
import com.medtrack.supplier.dto.ShipmentRiskDTO;
import com.medtrack.supplier.dto.TrendAnalysisDTO;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ShipmentTrackingRepository shipmentTrackingRepository;
    private final PredictionService predictionService;

    @Transactional(readOnly = true)
    public List<RecommendationDTO> getRecommendations(Long supplierId) {
        List<RecommendationDTO> recommendations = new ArrayList<>();

        // 1. Analyze high risk shipments
        List<ShipmentTracking> activeShipments = shipmentTrackingRepository.findBySupplierIdAndShipmentStatusIn(
                supplierId,
                List.of(ShipmentStatus.IN_TRANSIT, ShipmentStatus.SHIPPED, ShipmentStatus.PROCESSING));

        for (ShipmentTracking st : activeShipments) {
            ShipmentRiskDTO risk = predictionService.calculateShipmentRisk(supplierId, st.getOrderId());
            if ("CRITICAL".equals(risk.getRiskLevel()) || "HIGH".equals(risk.getRiskLevel())) {
                recommendations.add(RecommendationDTO.builder()
                        .type("IMMEDIATE_ACTION")
                        .severity(risk.getRiskLevel())
                        .message("Shipment " + st.getShipmentTrackingNumber() + " is at high risk due to: "
                                + risk.getRiskFactor())
                        .relatedEntityId(st.getOrderId())
                        .build());
            }
        }

        // 2. Check Supplier Delay Probability
        PredictionDTO delayProbability = predictionService.getDelayProbability(supplierId);
        if (delayProbability.getValue() > 30.0) {
            recommendations.add(RecommendationDTO.builder()
                    .type("PERFORMANCE_IMPROVEMENT")
                    .severity("HIGH")
                    .message("Your delay probability is high (" + String.format("%.1f", delayProbability.getValue())
                            + "%). Review dispatch procedures.")
                    .relatedEntityId(supplierId)
                    .build());
        }

        // 3. Trend Analysis
        TrendAnalysisDTO trends = predictionService.getTrendAnalysis(supplierId);
        if (!trends.getDelayHistory().isEmpty()) {
            java.util.Map.Entry<String, Integer> lastMonth = trends.getDelayHistory().entrySet().stream()
                    .reduce((first, second) -> second)
                    .orElse(null);

            if (lastMonth != null && lastMonth.getValue() > 5) {
                recommendations.add(RecommendationDTO.builder()
                        .type("PERFORMANCE_IMPROVEMENT")
                        .severity("MEDIUM")
                        .message("You had " + lastMonth.getValue() + " delays in " + lastMonth.getKey()
                                + ". Consider evaluating logistics partners.")
                        .relatedEntityId(supplierId)
                        .build());
            }
        }

        if (recommendations.isEmpty()) {
            recommendations.add(RecommendationDTO.builder()
                    .type("OPERATIONAL_EXCELLENCE")
                    .severity("LOW")
                    .message("All metrics are optimal. Keep up the good performance!")
                    .relatedEntityId(supplierId)
                    .build());
        }

        return recommendations;
    }
}
