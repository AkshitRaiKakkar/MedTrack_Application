-- Equipment stock tracking.
--
-- EquipmentRepository.findLowStockEquipment has always been written against e.quantity and
-- e.minimumStock, and EquipmentService.addEquipment has always defaulted them to 0 and 10, but
-- neither column nor field ever existed. Hibernate validates JPQL at bootstrap, so the application
-- context could not refresh:
--
--   Could not resolve attribute 'quantity' of 'com.medtrack.model.Equipment'
--
-- Added nullable first so the backfill can run against existing rows, then tightened. The defaults
-- match what the service already assumed, so previously-created assets end up in the same state
-- they would have had if the columns had existed all along.

ALTER TABLE equipment ADD COLUMN quantity INT NULL;
ALTER TABLE equipment ADD COLUMN minimum_stock INT NULL;

UPDATE equipment SET quantity = 0 WHERE quantity IS NULL;
UPDATE equipment SET minimum_stock = 10 WHERE minimum_stock IS NULL;

ALTER TABLE equipment MODIFY quantity INT NOT NULL DEFAULT 0;
ALTER TABLE equipment MODIFY minimum_stock INT NOT NULL DEFAULT 10;

-- Negative stock is never a legitimate state. EquipmentService.adjustStock rejects any delta that
-- would produce one, and this constraint stops a direct write or a future code path from bypassing
-- that check.
ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_quantity_non_negative
    CHECK (quantity >= 0);

ALTER TABLE equipment
    ADD CONSTRAINT chk_equipment_minimum_stock_non_negative
    CHECK (minimum_stock >= 0);

-- findLowStockEquipment filters by hospital and then compares the two columns. The composite index
-- lets the hospital predicate be served from the index rather than a full table scan; the
-- column-to-column comparison itself is not indexable.
CREATE INDEX idx_equipment_hospital_quantity ON equipment (hospital_id, quantity);
