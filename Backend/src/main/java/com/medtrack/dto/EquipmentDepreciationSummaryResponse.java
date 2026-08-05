package com.medtrack.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class EquipmentDepreciationSummaryResponse {
    private Long equipmentId;
    private BigDecimal latestDepreciationAmount;
    private BigDecimal totalDepreciationRecorded;
    private long snapshotCount;
}
