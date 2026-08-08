package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentRiskDTO {
    private Long orderId;
    private String trackingNumber;
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private Double riskScore; // 0.0 to 100.0
    private String riskFactor; // e.g., "Frequent Delays on Route", "High Workload"
}
