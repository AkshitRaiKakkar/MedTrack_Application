package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyShipmentReport {
    private String month; // e.g. "2023-01" or "JANUARY"
    private long totalShipments;
    private long successfulShipments;
    private long delayedShipments;
}
