package com.medtrack.supplier.service.prediction;

import com.medtrack.supplier.dto.PredictionDTO;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PredictionServiceTest {

    @Mock
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @InjectMocks
    private PredictionService predictionService;

    @Test
    void testGetDailyForecast() {
        when(shipmentTrackingRepository.countShipmentsBySupplierAndDateRange(eq(1L), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(60L);

        PredictionDTO prediction = predictionService.getDailyForecast(1L);

        assertNotNull(prediction);
        assertEquals("DAILY_FORECAST", prediction.getCategory());
        assertEquals(2.0, prediction.getValue());
    }

    @Test
    void testGetDelayProbability() {
        when(shipmentTrackingRepository.countShipmentsBySupplierAndDateRange(eq(1L), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(100L);
        when(shipmentTrackingRepository.countDelayedShipmentsBySupplierAndDateRange(eq(1L), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(15L);

        PredictionDTO prediction = predictionService.getDelayProbability(1L);

        assertNotNull(prediction);
        assertEquals("DELAY_PROBABILITY", prediction.getCategory());
        assertEquals(15.0, prediction.getValue());
    }
}
