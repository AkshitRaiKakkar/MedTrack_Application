package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Three-way matching record between request/order, receiving, and invoice metadata. The match
 * decision records {@link InvoiceMatchStatus} so discrepancies stay visible and auditable.
 */
@Entity
@Table(name = "invoice_match_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceMatchRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal invoiceAmount;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "received_amount", precision = 14, scale = 2)
    private BigDecimal receivedAmount;

    @Column(name = "ordered_amount", precision = 14, scale = 2)
    private BigDecimal orderedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InvoiceMatchStatus status = InvoiceMatchStatus.UNRESOLVED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "matched_by", length = 255)
    private String matchedBy;

    @Column(name = "matched_at")
    private LocalDateTime matchedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
