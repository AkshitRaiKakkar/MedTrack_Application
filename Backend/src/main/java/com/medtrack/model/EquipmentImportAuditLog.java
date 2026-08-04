package com.medtrack.model;

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

/**
 * Immutable audit trail entry for a bulk equipment import batch.
 *
 * <p>One row per upload through {@code POST /api/equipment/import}: who imported, from which file,
 * and how the batch came out. The {@code failures} column holds the per-row failure reasons as JSON
 * so an auditor can reconstruct exactly what was rejected and why.</p>
 */
@Entity
@Table(name = "equipment_import_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentImportAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(nullable = false, length = 255)
    private String actor;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "total_rows", nullable = false)
    private int totalRows;

    @Column(name = "success_count", nullable = false)
    private int successCount;

    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Column(columnDefinition = "TEXT")
    private String failures;

    @Column(name = "imported_at", nullable = false, updatable = false)
    private LocalDateTime importedAt;
}
