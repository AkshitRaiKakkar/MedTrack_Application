package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentFailureRiskDto {
    private int failureProbability; // 0-100%
    private String riskTier; // LOW, MODERATE, HIGH, CRITICAL
    private LocalDate predictedFailureDate;
    private String recommendation;
}
