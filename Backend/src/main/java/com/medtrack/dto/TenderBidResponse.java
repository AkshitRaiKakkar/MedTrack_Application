package com.medtrack.dto;

import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * View of a single tender bid for the comparison table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderBidResponse {

    private Long id;
    private Long tenderId;
    private Long hospitalId;
    private Integer roundNumber;
    private Long supplierId;
    private String supplierName;
    private String supplierEmail;
    private BigDecimal bidAmount;
    private Integer leadTimeDays;
    private Integer qualityScore;
    private Integer deliveryScore;
    private String notes;
    private TenderBidStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime decidedAt;

    public static TenderBidResponse from(TenderBid bid) {
        return TenderBidResponse.builder()
                .id(bid.getId())
                .tenderId(bid.getTenderId())
                .hospitalId(bid.getHospitalId())
                .roundNumber(bid.getRoundNumber())
                .supplierId(bid.getSupplierId())
                .supplierName(bid.getSupplierName())
                .supplierEmail(bid.getSupplierEmail())
                .bidAmount(bid.getBidAmount())
                .leadTimeDays(bid.getLeadTimeDays())
                .qualityScore(bid.getQualityScore())
                .deliveryScore(bid.getDeliveryScore())
                .notes(bid.getNotes())
                .status(bid.getStatus())
                .submittedAt(bid.getSubmittedAt())
                .decidedAt(bid.getDecidedAt())
                .build();
    }
}
