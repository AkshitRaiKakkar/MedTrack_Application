-- Equipment stock tracking. H2 counterpart of the MySQL V6 migration; see that file for the full
-- rationale.
--
-- H2 uses ALTER COLUMN ... SET NOT NULL / SET DEFAULT rather than MySQL's MODIFY, so the tightening
-- statements differ even though the resulting schema is identical.

ALTER TABLE equipment ADD COLUMN quantity INT NULL;
ALTER TABLE equipment ADD COLUMN minimum_stock INT NULL;

UPDATE equipment SET quantity = 0 WHERE quantity IS NULL;
UPDATE equipment SET minimum_stock = 10 WHERE minimum_stock IS NULL;

ALTER TABLE equipment ALTER COLUMN quantity SET DEFAULT 0;
ALTER TABLE equipment ALTER COLUMN quantity SET NOT NULL;

ALTER TABLE equipment ALTER COLUMN minimum_stock SET DEFAULT 10;
ALTER TABLE equipment ALTER COLUMN minimum_stock SET NOT NULL;

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_quantity_non_negative
    CHECK (quantity >= 0);

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_minimum_stock_non_negative
    CHECK (minimum_stock >= 0);

CREATE INDEX idx_equipment_hospital_quantity ON equipment (hospital_id, quantity);
