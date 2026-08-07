package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentWorkflowDTO {
    private Long orderId;
    private String trackingNumber;
    private String currentStatus;
    private boolean isDelayed;
    private List<WorkflowStatusDTO> steps;
}
