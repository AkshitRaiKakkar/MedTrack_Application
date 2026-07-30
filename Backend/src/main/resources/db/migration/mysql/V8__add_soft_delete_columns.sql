-- Migration V8: Add soft delete columns to equipment, equipment_orders, maintenance_tasks
-- This migration adds soft delete support for audit compliance

-- Equipment table
ALTER TABLE equipment ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE equipment ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE equipment ADD COLUMN deleted_by VARCHAR(255) NULL;

-- Equipment Orders table
ALTER TABLE equipment_orders ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE equipment_orders ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE equipment_orders ADD COLUMN deleted_by VARCHAR(255) NULL;

-- Maintenance Tasks table
ALTER TABLE maintenance_tasks ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE maintenance_tasks ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE maintenance_tasks ADD COLUMN deleted_by VARCHAR(255) NULL;

-- Create indexes for soft delete queries
CREATE INDEX idx_equipment_deleted ON equipment(deleted);
CREATE INDEX idx_equipment_orders_deleted ON equipment_orders(deleted);
CREATE INDEX idx_maintenance_tasks_deleted ON maintenance_tasks(deleted);