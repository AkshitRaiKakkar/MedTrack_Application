-- Migration V8: Add soft delete columns to equipment, equipment_orders, maintenance_tasks
-- This migration adds soft delete support for audit compliance

-- Equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- Equipment Orders table
ALTER TABLE equipment_orders ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE equipment_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE equipment_orders ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- Maintenance Tasks table
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_equipment_deleted ON equipment(deleted);
CREATE INDEX IF NOT EXISTS idx_equipment_orders_deleted ON equipment_orders(deleted);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_deleted ON maintenance_tasks(deleted);