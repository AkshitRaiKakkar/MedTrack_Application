ALTER TABLE equipment ADD COLUMN room_location VARCHAR(100) NULL;
ALTER TABLE equipment ADD COLUMN ward_location VARCHAR(100) NULL;
ALTER TABLE equipment ADD COLUMN custodian VARCHAR(255) NULL;
ALTER TABLE equipment ADD COLUMN location_effective_date DATE NULL;
ALTER TABLE equipment ADD COLUMN replacement_equipment_id BIGINT NULL;

CREATE TABLE equipment_lifecycle_actions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    equipment_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    previous_department VARCHAR(255) NULL,
    new_department VARCHAR(255) NULL,
    room_location VARCHAR(100) NULL,
    ward_location VARCHAR(100) NULL,
    custodian VARCHAR(255) NULL,
    effective_date DATE NULL,
    replacement_equipment_id BIGINT NULL,
    depreciation_amount DECIMAL(14, 2) NULL,
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
    CONSTRAINT fk_equipment_lifecycle_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    CONSTRAINT fk_equipment_lifecycle_replacement FOREIGN KEY (replacement_equipment_id) REFERENCES equipment(id)
);

CREATE INDEX idx_equipment_lifecycle_equipment ON equipment_lifecycle_actions (equipment_id, hospital_id, requested_at);
CREATE INDEX idx_equipment_lifecycle_status ON equipment_lifecycle_actions (hospital_id, status, requested_at);
