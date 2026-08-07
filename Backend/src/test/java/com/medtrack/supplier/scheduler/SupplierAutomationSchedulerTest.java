package com.medtrack.supplier.scheduler;

import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.service.DeliveryDelayDetectionService;
import com.medtrack.supplier.service.SupplierPerformanceService;
import com.medtrack.supplier.service.scheduler.SupplierAutomationScheduler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SupplierAutomationSchedulerTest {

    @Mock
    private SupplierPerformanceService supplierPerformanceService;

    @Mock
    private DeliveryDelayDetectionService deliveryDelayDetectionService;

    @Mock
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @InjectMocks
    private SupplierAutomationScheduler scheduler;

    @Test
    void testScheduledPerformanceRecalculation() {
        List<Long> supplierIds = Arrays.asList(1L, 2L, 3L);
        when(shipmentTrackingRepository.findDistinctSupplierIds()).thenReturn(supplierIds);

        scheduler.scheduledPerformanceRecalculation();

        verify(shipmentTrackingRepository, times(1)).findDistinctSupplierIds();
        verify(supplierPerformanceService, times(1)).publishPerformanceUpdate(1L);
        verify(supplierPerformanceService, times(1)).publishPerformanceUpdate(2L);
        verify(supplierPerformanceService, times(1)).publishPerformanceUpdate(3L);
    }

    @Test
    void testScheduledDelayedShipmentScan() {
        scheduler.scheduledDelayedShipmentScan();
        verify(deliveryDelayDetectionService, times(1)).detectDelays();
    }
}
