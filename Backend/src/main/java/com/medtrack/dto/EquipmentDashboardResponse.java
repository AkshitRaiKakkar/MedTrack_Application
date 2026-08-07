package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDashboardResponse {

    private long totalEquipment;
    private long activeEquipment;
    private long underMaintenance;
    private long retiredEquipment;
    private long expiredWarranty;
    private long warrantyExpiringSoon;
    private long lowStockEquipment;
}