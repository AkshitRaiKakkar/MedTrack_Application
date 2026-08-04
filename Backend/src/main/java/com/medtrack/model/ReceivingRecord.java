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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A receiving record: how many units arrived, their condition, serial numbers, warranty dates,
 * and any discrepancy notes. A request may accumulate several records for partial deliveries.
 */
@Entity
@Table(name = "receiving_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReceivingCondition condition = ReceivingCondition.GOOD;

    @Column(name = "serial_numbers", length = 1000)
    private String serialNumbers;

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    @Column(columnDefinition = "TEXT")
    private String discrepancyNotes;

    @Column(name = "received_by", nullable = false, length = 255)
    private String receivedBy;

    @Column(name = "received_at", nullable = false, updatable = false)
    private LocalDateTime receivedAt;
}
