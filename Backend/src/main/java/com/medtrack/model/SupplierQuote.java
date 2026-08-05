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
import java.time.LocalDateTime;

/**
 * A supplier response to a procurement request's RFQ. Quotes are compared on the hospital side;
 * the winning quote is accepted, which finalizes the order.
 */
@Entity
@Table(name = "supplier_quotes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;
    @Column(name = "supplier_name", nullable = false, length = 255)
    private String supplierName;
    @Column(name = "supplier_email", nullable = false, length = 255)
    private String supplierEmail;

    @Column(name = "quote_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal quoteAmount;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SupplierQuoteStatus status = SupplierQuoteStatus.PENDING;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
}
