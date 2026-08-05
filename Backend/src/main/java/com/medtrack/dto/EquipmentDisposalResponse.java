package com.medtrack.dto;

import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalMethod;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class EquipmentDisposalResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private String department;
    private EquipmentStatus equipmentStatus;
    private EquipmentDisposalMethod disposalMethod;
    private String disposalReason;
    private LocalDate effectiveDate;
    private Boolean storesPatientData;
    private Boolean dataSanitizationConfirmed;
    private String dataSanitizationDetails;
    private LocalDateTime dataSanitizedAt;
    private String dataSanitizedBy;
    private EquipmentDisposalStatus status;
    private String certificateNumber;
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

    public static EquipmentDisposalResponse from(EquipmentDisposal disposal) {
        return EquipmentDisposalResponse.builder()
                .id(disposal.getId())
                .equipmentId(disposal.getEquipment().getId())
                .equipmentCode(disposal.getEquipment().getEquipmentCode())
                .equipmentName(disposal.getEquipment().getName())
                .department(disposal.getEquipment().getDepartment())
                .equipmentStatus(disposal.getEquipment().getStatus())
                .disposalMethod(disposal.getDisposalMethod())
                .disposalReason(disposal.getDisposalReason())
                .effectiveDate(disposal.getEffectiveDate())
                .storesPatientData(disposal.getStoresPatientData())
                .dataSanitizationConfirmed(disposal.getDataSanitizationConfirmed())
                .dataSanitizationDetails(disposal.getDataSanitizationDetails())
                .dataSanitizedAt(disposal.getDataSanitizedAt())
                .dataSanitizedBy(disposal.getDataSanitizedBy())
                .status(disposal.getStatus())
                .certificateNumber(disposal.getCertificateNumber())
                .notes(disposal.getNotes())
                .requestedBy(disposal.getRequestedBy())
                .approvedBy(disposal.getApprovedBy())
                .rejectedBy(disposal.getRejectedBy())
                .rejectedReason(disposal.getRejectedReason())
                .completedBy(disposal.getCompletedBy())
                .cancelledBy(disposal.getCancelledBy())
                .requestedAt(disposal.getRequestedAt())
                .approvedAt(disposal.getApprovedAt())
                .rejectedAt(disposal.getRejectedAt())
                .completedAt(disposal.getCompletedAt())
                .cancelledAt(disposal.getCancelledAt())
                .build();
    }
}
