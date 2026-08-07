package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendAnalysisDTO {
    private Long supplierId;
    private Map<String, Double> performanceHistory; // e.g., Month -> Score
    private Map<String, Integer> delayHistory; // e.g., Month -> Count
    private Map<String, Integer> shipmentVolumeHistory; // e.g., Month -> Count
}
