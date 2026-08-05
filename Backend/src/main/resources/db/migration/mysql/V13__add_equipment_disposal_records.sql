-- Decommissioning / disposal workflow (issue #744).
-- Assets are never silently deleted: a disposal record documents the method and reason, the
-- manager approval, the data-sanitisation confirmation and the certificate of disposal.

CREATE TABLE equipment_disposals (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    equipment_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    disposal_method VARCHAR(40) NOT NULL,
    disposal_reason TEXT NULL,
    effective_date DATE NULL,
    stores_patient_data BOOLEAN NOT NULL DEFAULT FALSE,
    data_sanitization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    data_sanitization_details TEXT NULL,
    data_sanitized_at TIMESTAMP NULL,
    data_sanitized_by VARCHAR(255) NULL,
    status VARCHAR(40) NOT NULL,
    certificate_number VARCHAR(40) NULL,
    notes TEXT NULL,
    requested_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255) NULL,
    rejected_by VARCHAR(255) NULL,
    rejected_reason TEXT NULL,
    completed_by VARCHAR(255) NULL,
    cancelled_by VARCHAR(255) NULL,
    requested_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    CONSTRAINT fk_equipment_disposal_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE INDEX idx_equipment_disposal_equipment ON equipment_disposals (equipment_id, hospital_id, requested_at);
CREATE INDEX idx_equipment_disposal_status ON equipment_disposals (hospital_id, status, requested_at);
CREATE INDEX idx_equipment_disposal_certificate ON equipment_disposals (certificate_number);
