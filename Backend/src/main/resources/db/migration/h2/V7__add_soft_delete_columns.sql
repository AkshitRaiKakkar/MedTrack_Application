-- Soft delete support for audit compliance. H2 counterpart of the MySQL V7 migration.
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
-- that. ADD COLUMN IF NOT EXISTS does not help either: the guard is on the column, not the table.
-- Its soft-delete columns are left to Hibernate, exactly like every other column on that table.
--
-- This is the same mistake V7__add_vulnerability_policy_sla_columns.sql made against
-- `vulnerability_policies`, which is why FlywayMigrationConsistencyTest exists.

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- Every read of these tables now carries a `deleted = false` predicate, so the flag sits on the
-- leading edge of most queries.
CREATE INDEX IF NOT EXISTS idx_equipment_deleted ON equipment (deleted);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_deleted ON maintenance_tasks (deleted);
