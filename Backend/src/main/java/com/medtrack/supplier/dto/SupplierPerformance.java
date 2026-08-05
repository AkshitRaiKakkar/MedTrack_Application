package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPerformance {
    private double performanceScore;
    private String rating; // e.g. EXCELLENT, GOOD, POOR
}
