package com.medtrack.dto;

import com.medtrack.model.Equipment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class EquipmentLocationResponse {
    private Long equipmentId;
    private String equipmentCode;
    private String department;
    private String roomLocation;
    private String wardLocation;
    private String custodian;
    private LocalDate effectiveDate;

    public static EquipmentLocationResponse from(Equipment equipment) {
        return EquipmentLocationResponse.builder()
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getEquipmentCode())
                .department(equipment.getDepartment())
                .roomLocation(equipment.getRoomLocation())
                .wardLocation(equipment.getWardLocation())
                .custodian(equipment.getCustodian())
                .effectiveDate(equipment.getLocationEffectiveDate())
                .build();
    }
}
