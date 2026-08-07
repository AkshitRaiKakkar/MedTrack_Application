package com.medtrack.supplier.service.prediction;

import com.medtrack.supplier.dto.PredictionDTO;
import com.medtrack.supplier.dto.RecommendationDTO;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.dto.TrendAnalysisDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @Mock
    private PredictionService predictionService;

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    void testGetRecommendationsSubmitsDelayWarning() {
        when(shipmentTrackingRepository.findBySupplierIdAndShipmentStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.emptyList());

        PredictionDTO highDelay = PredictionDTO.builder().value(45.0).build();
        when(predictionService.getDelayProbability(1L)).thenReturn(highDelay);
        when(predictionService.getTrendAnalysis(1L)).thenReturn(TrendAnalysisDTO.builder()
                .delayHistory(Collections.emptyMap())
                .build());

        List<RecommendationDTO> recommendations = recommendationService.getRecommendations(1L);

        assertFalse(recommendations.isEmpty());
        RecommendationDTO rec = recommendations.stream().filter(r -> "PERFORMANCE_IMPROVEMENT".equals(r.getType()))
                .findFirst().orElse(null);
        assertNotNull(rec);
        assertEquals("HIGH", rec.getSeverity());
    }

    @Test
    void testGetRecommendationsOptimal() {
        when(shipmentTrackingRepository.findBySupplierIdAndShipmentStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.emptyList());

        PredictionDTO lowDelay = PredictionDTO.builder().value(10.0).build();
        when(predictionService.getDelayProbability(1L)).thenReturn(lowDelay);
        when(predictionService.getTrendAnalysis(1L)).thenReturn(TrendAnalysisDTO.builder()
                .delayHistory(Collections.emptyMap())
                .build());

        List<RecommendationDTO> recommendations = recommendationService.getRecommendations(1L);

        assertFalse(recommendations.isEmpty());
        assertEquals("OPERATIONAL_EXCELLENCE", recommendations.get(0).getType());
    }
}
