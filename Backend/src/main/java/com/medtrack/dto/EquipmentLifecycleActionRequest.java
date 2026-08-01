package com.medtrack.dto;

import com.medtrack.model.EquipmentLifecycleActionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EquipmentLifecycleActionRequest {
    @NotNull
    private EquipmentLifecycleActionType actionType;
    private String newDepartment;
    private String roomLocation;
    private String wardLocation;
    private String custodian;
    private LocalDate effectiveDate;
    private Long replacementEquipmentId;
    private BigDecimal depreciationAmount;
    private String notes;
}
