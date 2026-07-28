package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EquipmentStatisticsResponse {

    private long totalEquipment;
    private long active;
    private long underMaintenance;
    private long retired;
    private long expiredWarranty;
}