-- Soft delete support for audit compliance: records are flagged rather than removed, so an
-- archived asset or maintenance record stays available for audit and can be restored.
--
-- Scope note: only `equipment` and `maintenance_tasks` are Flyway-managed. This migration
-- originally also carried three ALTERs and an index against `equipment_orders`, and failed
-- outright:
--
--   FlywaySqlScriptException: Failed to execute script V8__add_soft_delete_columns.sql
--   SQL State  : 42S02
--   Message    : Table "EQUIPMENT_ORDERS" not found
--
-- `equipment_orders` is created by hibernate.ddl-auto=update, and Flyway runs *before* Hibernate,
-- so the table does not exist at the point this script executes and no version number would change
-- that. Its soft-delete columns are left to Hibernate, exactly like every other column on that
-- table.
--
-- This is the same mistake V7__add_vulnerability_policy_sla_columns.sql made against
-- `vulnerability_policies`, which is why FlywayMigrationConsistencyTest exists.
--
-- MySQL has no ADD COLUMN IF NOT EXISTS, so these are written to run exactly once against a schema
-- that does not yet carry the columns; Flyway's version ledger is what makes that safe.

ALTER TABLE equipment ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE equipment ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE equipment ADD COLUMN deleted_by VARCHAR(255) NULL;

ALTER TABLE maintenance_tasks ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE maintenance_tasks ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE maintenance_tasks ADD COLUMN deleted_by VARCHAR(255) NULL;

-- Every read of these tables now carries a `deleted = false` predicate, so the flag sits on the
-- leading edge of most queries.
CREATE INDEX idx_equipment_deleted ON equipment (deleted);
CREATE INDEX idx_maintenance_tasks_deleted ON maintenance_tasks (deleted);
