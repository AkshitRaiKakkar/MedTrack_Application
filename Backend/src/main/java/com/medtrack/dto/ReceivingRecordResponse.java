package com.medtrack.dto;

import com.medtrack.model.ReceivingCondition;
import com.medtrack.model.ReceivingRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivingRecordResponse {

    private Long id;
    private Long requestId;
    private Long hospitalId;
    private Long orderId;
    private Integer quantityReceived;
    private ReceivingCondition condition;
    private String serialNumbers;
    private LocalDate warrantyExpiry;
    private String discrepancyNotes;
    private String receivedBy;
    private LocalDateTime receivedAt;

    public static ReceivingRecordResponse from(ReceivingRecord record) {
        return ReceivingRecordResponse.builder()
                .id(record.getId())
                .requestId(record.getRequestId())
                .hospitalId(record.getHospitalId())
                .orderId(record.getOrderId())
                .quantityReceived(record.getQuantityReceived())
                .condition(record.getCondition())
                .serialNumbers(record.getSerialNumbers())
                .warrantyExpiry(record.getWarrantyExpiry())
                .discrepancyNotes(record.getDiscrepancyNotes())
                .receivedBy(record.getReceivedBy())
                .receivedAt(record.getReceivedAt())
                .build();
    }
}
