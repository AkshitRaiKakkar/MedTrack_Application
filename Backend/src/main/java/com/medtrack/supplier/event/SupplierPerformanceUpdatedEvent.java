package com.medtrack.supplier.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event published when supplier performance reaches a new score, typically after an order is delivered or a delay is detected.
 * Used for downward analytics pipelines.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPerformanceUpdatedEvent {
    private Long supplierId;
    private long totalShipments;
    private long deliveredShipments;
    private long delayedShipments;
    private double onTimeDeliveryRate;
    private double performanceScore;
    private LocalDateTime timestamp;
}
