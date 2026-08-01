package com.medtrack.dto;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class EquipmentLifecycleActionResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private EquipmentLifecycleActionType actionType;
    private EquipmentLifecycleStatus status;
    private String previousDepartment;
    private String newDepartment;
    private String roomLocation;
    private String wardLocation;
    private String custodian;
    private LocalDate effectiveDate;
    private Long replacementEquipmentId;
    private String replacementEquipmentName;
    private BigDecimal depreciationAmount;
    private String notes;
    private String requestedBy;
    private String approvedBy;
    private String rejectedBy;
    private String rejectedReason;
    private String completedBy;
    private String cancelledBy;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    public static EquipmentLifecycleActionResponse from(EquipmentLifecycleAction action) {
        Equipment equipment = action.getEquipment();
        Equipment replacement = action.getReplacementEquipment();
        return EquipmentLifecycleActionResponse.builder()
                .id(action.getId())
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getEquipmentCode())
                .equipmentName(equipment.getName())
                .actionType(action.getActionType())
                .status(action.getStatus())
                .previousDepartment(action.getPreviousDepartment())
                .newDepartment(action.getNewDepartment())
                .roomLocation(action.getRoomLocation())
                .wardLocation(action.getWardLocation())
                .custodian(action.getCustodian())
                .effectiveDate(action.getEffectiveDate())
                .replacementEquipmentId(replacement != null ? replacement.getId() : null)
                .replacementEquipmentName(replacement != null ? replacement.getName() : null)
                .depreciationAmount(action.getDepreciationAmount())
                .notes(action.getNotes())
                .requestedBy(action.getRequestedBy())
                .approvedBy(action.getApprovedBy())
                .rejectedBy(action.getRejectedBy())
                .rejectedReason(action.getRejectedReason())
                .completedBy(action.getCompletedBy())
                .cancelledBy(action.getCancelledBy())
                .requestedAt(action.getRequestedAt())
                .approvedAt(action.getApprovedAt())
                .rejectedAt(action.getRejectedAt())
                .completedAt(action.getCompletedAt())
                .cancelledAt(action.getCancelledAt())
                .build();
    }
}
