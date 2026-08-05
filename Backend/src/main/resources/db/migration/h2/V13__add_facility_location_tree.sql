-- Facilition location tree and per-asset assignment history (issue #745).
-- facility_location is a self-referencing tree keyed by hospital_id; parent links are plain
-- columns (matching the existing equipment_lifecycle_actions pattern) so a hospital's whole tree
-- can be fetched in one pass. equipment.location_id carries the asset's current location.

CREATE TABLE facility_location (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255) NULL
);

CREATE INDEX idx_facility_location_hospital ON facility_location (hospital_id, parent_id);

CREATE TABLE equipment_location_history (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    equipment_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    effective_date DATE NULL,
    notes VARCHAR(500) NULL,
    moved_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_equipment_location_history_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE INDEX idx_equipment_location_history_equipment ON equipment_location_history (equipment_id, created_at);
CREATE INDEX idx_equipment_location_history_location ON equipment_location_history (location_id);

ALTER TABLE equipment ADD COLUMN location_id BIGINT NULL;