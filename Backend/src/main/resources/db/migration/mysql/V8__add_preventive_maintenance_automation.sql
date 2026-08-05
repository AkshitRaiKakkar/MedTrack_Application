-- Preventive-maintenance automation: recurrence rules, generation-run idempotency ledger,
-- and SLA/escalation columns on maintenance_tasks.
--
-- All three tables referenced here are Flyway-managed: maintenance_tasks has been under migration
-- control since V1, and maintenance_policy_rules / maintenance_generation_runs are created by this
-- script and registered in FLYWAY_MANAGED_TABLES in FlywayMigrationConsistencyTest.
--
-- MySQL has no CREATE TABLE IF NOT EXISTS awareness in this codebase's migration style, and no
-- ADD COLUMN IF NOT EXISTS, so these statements are written to run exactly once against a schema
-- that does not yet carry them; Flyway's version ledger is what makes that safe.

CREATE TABLE maintenance_policy_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    rule_scope VARCHAR(50) NOT NULL,
    equipment_category VARCHAR(50),
    equipment_record_id BIGINT,
    manufacturer VARCHAR(255),
    priority VARCHAR(255),
    frequency VARCHAR(50) NOT NULL,
    custom_interval_days INT,
    maintenance_type VARCHAR(255) NOT NULL,
    sla_warning_days INT NOT NULL DEFAULT 3,
    sla_breach_days INT NOT NULL DEFAULT 1,
    lead_time_days INT NOT NULL DEFAULT 7,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_generated_at DATE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_maintenance_policy_rule_equipment FOREIGN KEY (equipment_record_id) REFERENCES equipment(id)
);

CREATE INDEX idx_policy_rule_hospital ON maintenance_policy_rules (hospital_id, active);

CREATE TABLE maintenance_generation_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    policy_rule_id BIGINT NOT NULL,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    tasks_generated INT NOT NULL DEFAULT 0,
    skipped_existing INT NOT NULL DEFAULT 0,
    detail VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_generation_run_window UNIQUE (hospital_id, policy_rule_id, window_start, window_end),
    CONSTRAINT fk_generation_run_rule FOREIGN KEY (policy_rule_id) REFERENCES maintenance_policy_rules(id)
);

CREATE INDEX idx_generation_run_hospital ON maintenance_generation_runs (hospital_id, created_at);

ALTER TABLE maintenance_tasks ADD COLUMN policy_rule_id BIGINT;
ALTER TABLE maintenance_tasks ADD COLUMN generation_run_id BIGINT;
ALTER TABLE maintenance_tasks ADD COLUMN sla_state VARCHAR(50) DEFAULT 'UPCOMING';
ALTER TABLE maintenance_tasks ADD COLUMN sla_breached_at TIMESTAMP NULL;
ALTER TABLE maintenance_tasks ADD COLUMN sla_warning_at TIMESTAMP NULL;
ALTER TABLE maintenance_tasks ADD COLUMN escalated_to VARCHAR(255);

CREATE INDEX idx_maintenance_tasks_sla ON maintenance_tasks (hospital_id, sla_state);
