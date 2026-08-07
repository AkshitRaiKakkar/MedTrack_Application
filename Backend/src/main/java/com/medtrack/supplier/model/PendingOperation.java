package com.medtrack.supplier.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_operations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long targetId; // e.g. orderId or shipmentTrackingId

    @Column(nullable = false, length = 100)
    private String operationType; // e.g. EVENT_PUBLISH, STATUS_UPDATE

    @Column(columnDefinition = "TEXT")
    private String payload; // JSON data for the operation (optional)

    @Column(nullable = false, length = 50)
    private String status; // PENDING, RECOVERED, FAILED

    @Builder.Default
    @Column(nullable = false)
    private int retryCount = 0;

    @Column(columnDefinition = "TEXT")
    private String lastErrorMessage;

    @Column(nullable = false)
    private LocalDateTime nextRetryAt;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime updatedAt;
}
