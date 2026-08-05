-- Procurement approvals and receiving reconciliation workflow.
--
-- All tables referenced here are Flyway-managed: equipment (V1), maintenance_tasks (V1),
-- maintenance_policy_rules / maintenance_generation_runs (V8), and the seven new procurement
-- tables created by this script. Register any table this script touches in FLYWAY_MANAGED_TABLES
-- in FlywayMigrationConsistencyTest.
--
-- MySQL has no CREATE TABLE IF NOT EXISTS awareness in this codebase's migration style, and no
-- ADD COLUMN IF NOT EXISTS, so these statements are written to run exactly once against a schema
-- that does not yet carry them; Flyway's version ledger is what makes that safe.

CREATE TABLE procurement_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL,
    hospital_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    equipment_code VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12, 2),
    total_cost DECIMAL(14, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    urgency VARCHAR(20),
    category VARCHAR(50),
    budget_reserved DECIMAL(14, 2),
    order_id BIGINT,
    notes TEXT,
    approval_due_at DATETIME,
    requested_at DATETIME NOT NULL,
    updated_at DATETIME,
    decided_at DATETIME,
    decided_by VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME,
    deleted_by VARCHAR(255),
    CONSTRAINT uk_procurement_request_code UNIQUE (request_code)
);

CREATE INDEX idx_procurement_request_hospital ON procurement_requests (hospital_id, status);
CREATE INDEX idx_procurement_request_requester ON procurement_requests (requester_id);

CREATE TABLE approval_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    min_amount DECIMAL(14, 2),
    max_amount DECIMAL(14, 2),
    category VARCHAR(50),
    urgency VARCHAR(20),
    requester_role VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME,
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_approval_policy_hospital ON approval_policies (hospital_id, active);

CREATE TABLE approval_policy_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_id BIGINT NOT NULL,
    step_group INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_email VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME,
    deleted_by VARCHAR(255),
    CONSTRAINT fk_approval_policy_step_policy FOREIGN KEY (policy_id) REFERENCES approval_policies(id)
);

CREATE TABLE approval_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    step_group INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    comment TEXT,
    decided_by VARCHAR(255),
    decided_at DATETIME,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_approval_step_request FOREIGN KEY (request_id) REFERENCES procurement_requests(id)
);

CREATE INDEX idx_approval_step_request ON approval_steps (request_id, status);

CREATE TABLE supplier_quotes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_email VARCHAR(255) NOT NULL,
    quote_amount DECIMAL(14, 2) NOT NULL,
    lead_time_days INT,
    warranty_months INT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_at DATETIME NOT NULL,
    accepted_at DATETIME,
    CONSTRAINT fk_supplier_quote_request FOREIGN KEY (request_id) REFERENCES procurement_requests(id)
);

CREATE INDEX idx_supplier_quote_request ON supplier_quotes (request_id, status);

CREATE TABLE receiving_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    order_id BIGINT,
    quantity_received INT NOT NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'GOOD',
    serial_numbers VARCHAR(1000),
    warranty_expiry DATE,
    discrepancy_notes TEXT,
    received_by VARCHAR(255) NOT NULL,
    received_at DATETIME NOT NULL,
    CONSTRAINT fk_receiving_record_request FOREIGN KEY (request_id) REFERENCES procurement_requests(id)
);

CREATE TABLE invoice_match_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    order_id BIGINT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_amount DECIMAL(14, 2) NOT NULL,
    invoice_date DATE,
    received_amount DECIMAL(14, 2),
    ordered_amount DECIMAL(14, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'UNRESOLVED',
    notes TEXT,
    matched_by VARCHAR(255),
    matched_at DATETIME,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_invoice_match_request FOREIGN KEY (request_id) REFERENCES procurement_requests(id)
);

CREATE TABLE procurement_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_audit_log_request FOREIGN KEY (request_id) REFERENCES procurement_requests(id)
);

CREATE INDEX idx_audit_log_request ON procurement_audit_logs (request_id, created_at);
