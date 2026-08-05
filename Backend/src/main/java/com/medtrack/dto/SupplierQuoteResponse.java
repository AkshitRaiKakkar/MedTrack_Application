package com.medtrack.dto;

import com.medtrack.model.SupplierQuote;
import com.medtrack.model.SupplierQuoteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierQuoteResponse {

    private Long id;
    private Long requestId;
    private Long hospitalId;
    private Long supplierId;
    private String supplierName;
    private String supplierEmail;
    private BigDecimal quoteAmount;
    private Integer leadTimeDays;
    private Integer warrantyMonths;
    private String notes;
    private SupplierQuoteStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime acceptedAt;

    public static SupplierQuoteResponse from(SupplierQuote quote) {
        return SupplierQuoteResponse.builder()
                .id(quote.getId())
                .requestId(quote.getRequestId())
                .hospitalId(quote.getHospitalId())
                .supplierId(quote.getSupplierId())
                .supplierName(quote.getSupplierName())
                .supplierEmail(quote.getSupplierEmail())
                .quoteAmount(quote.getQuoteAmount())
                .leadTimeDays(quote.getLeadTimeDays())
                .warrantyMonths(quote.getWarrantyMonths())
                .notes(quote.getNotes())
                .status(quote.getStatus())
                .submittedAt(quote.getSubmittedAt())
                .acceptedAt(quote.getAcceptedAt())
                .build();
    }
}
