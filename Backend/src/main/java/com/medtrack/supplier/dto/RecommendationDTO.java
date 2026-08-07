package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDTO {
    private String type; // e.g., "IMMEDIATE_ACTION", "PERFORMANCE_IMPROVEMENT"
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String message;
    private Long relatedEntityId; // e.g., supplierId or orderId
}
