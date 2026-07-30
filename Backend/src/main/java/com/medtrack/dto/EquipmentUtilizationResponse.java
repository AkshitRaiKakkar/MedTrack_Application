package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EquipmentUtilizationResponse {

    private long total;

    private long active;

    private long underMaintenance;

    private long retired;

    private double utilizationPercentage;
}