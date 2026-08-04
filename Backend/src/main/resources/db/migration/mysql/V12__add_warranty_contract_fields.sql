-- Warranty & service contract fields per asset (issue #703).
-- warranty_expiry already exists and acts as the coverage end date; the new columns carry the
-- contract details. All nullable: assets with no coverage simply leave them blank.
ALTER TABLE equipment
    ADD COLUMN warranty_provider VARCHAR(255),
    ADD COLUMN warranty_contract_number VARCHAR(100),
    ADD COLUMN warranty_start_date DATE,
    ADD COLUMN warranty_coverage_type VARCHAR(30),
    ADD COLUMN warranty_terms VARCHAR(2000);
