-- Fail migration when a legacy row contains a status that cannot be mapped to
-- MaintenanceStatus. Valid legacy display values were normalized in version 1.
ALTER TABLE maintenance_tasks
    ADD CONSTRAINT chk_maintenance_tasks_status
    CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'NEEDS_PART', 'ON_HOLD', 'COMPLETED'));
