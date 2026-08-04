-- Bulk equipment import audit trail.
--
-- Every import batch (CSV/Excel upload through /api/equipment/import) records one row here:
-- who imported, from which file, and how many rows were committed vs rejected, plus the
-- per-row failure reasons as JSON. The table is append-only: nothing is updated or deleted.

CREATE TABLE equipment_import_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    success_count INT NOT NULL,
    failure_count INT NOT NULL,
    failures TEXT,
    imported_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_equipment_import_audit_hospital ON equipment_import_audit_logs (hospital_id, imported_at);
