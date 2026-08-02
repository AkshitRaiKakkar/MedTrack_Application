package com.medtrack.dto;

import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
import com.medtrack.model.ProcurementUrgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * API-facing view of a procurement request plus its approval steps and accepted quote, so the
 * frontend can render the full lifecycle in one call.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementRequestResponse {

    private Long id;
    private String requestCode;
    private Long hospitalId;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private String equipmentCode;
    private String equipmentName;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private ProcurementRequestStatus status;
    private ProcurementUrgency urgency;
    private EquipmentCategory category;
    private BigDecimal budgetReserved;
    private Long orderId;
    private String notes;
    private LocalDateTime approvalDueAt;
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;
    private LocalDateTime decidedAt;
    private String decidedBy;

    private List<ApprovalStepResponse> approvalSteps;
    private SupplierQuoteResponse acceptedQuote;

    public static ProcurementRequestResponse from(ProcurementRequest request) {
        return ProcurementRequestResponse.builder()
                .id(request.getId())
                .requestCode(request.getRequestCode())
                .hospitalId(request.getHospitalId())
                .requesterId(request.getRequesterId())
                .requesterName(request.getRequesterName())
                .requesterEmail(request.getRequesterEmail())
                .equipmentCode(request.getEquipmentCode())
                .equipmentName(request.getEquipmentName())
                .quantity(request.getQuantity())
                .unitCost(request.getUnitCost())
                .totalCost(request.getTotalCost())
                .status(request.getStatus())
                .urgency(request.getUrgency())
                .category(request.getCategory())
                .budgetReserved(request.getBudgetReserved())
                .orderId(request.getOrderId())
                .notes(request.getNotes())
                .approvalDueAt(request.getApprovalDueAt())
                .requestedAt(request.getRequestedAt())
                .updatedAt(request.getUpdatedAt())
                .decidedAt(request.getDecidedAt())
                .decidedBy(request.getDecidedBy())
                .build();
    }
}
