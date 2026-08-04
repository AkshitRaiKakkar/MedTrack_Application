package com.medtrack.dto;

import com.medtrack.model.InvoiceMatchRecord;
import com.medtrack.model.InvoiceMatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceMatchResponse {

    private Long id;
    private Long requestId;
    private Long hospitalId;
    private Long orderId;
    private String invoiceNumber;
    private BigDecimal invoiceAmount;
    private LocalDate invoiceDate;
    private BigDecimal receivedAmount;
    private BigDecimal orderedAmount;
    private InvoiceMatchStatus status;
    private String notes;
    private String matchedBy;
    private LocalDateTime matchedAt;

    public static InvoiceMatchResponse from(InvoiceMatchRecord record) {
        return InvoiceMatchResponse.builder()
                .id(record.getId())
                .requestId(record.getRequestId())
                .hospitalId(record.getHospitalId())
                .orderId(record.getOrderId())
                .invoiceNumber(record.getInvoiceNumber())
                .invoiceAmount(record.getInvoiceAmount())
                .invoiceDate(record.getInvoiceDate())
                .receivedAmount(record.getReceivedAmount())
                .orderedAmount(record.getOrderedAmount())
                .status(record.getStatus())
                .notes(record.getNotes())
                .matchedBy(record.getMatchedBy())
                .matchedAt(record.getMatchedAt())
                .build();
    }
}
