package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentFinancialDashboardResponse {

    private EquipmentFinancialSummary summary;

    private List<EquipmentFinancialResponse> equipment;

    private LocalDateTime generatedAt;

    private String generatedBy;

}