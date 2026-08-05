CREATE TABLE maintenance_task_activities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    sequence_number BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor_user_id BIGINT NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    previous_assignee VARCHAR(255) NULL,
    new_assignee VARCHAR(255) NULL,
    changed_fields VARCHAR(500) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    occurred_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_maintenance_activity_sequence UNIQUE (task_id, sequence_number),
    CONSTRAINT fk_maintenance_activity_task
        FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
    CONSTRAINT fk_maintenance_activity_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id),
    CONSTRAINT chk_maintenance_activity_sequence CHECK (sequence_number > 0),
    CONSTRAINT chk_maintenance_activity_type CHECK (event_type IN (
        'TASK_CREATED',
        'TECHNICIAN_ASSIGNED',
        'TECHNICIAN_REASSIGNED',
        'STATUS_CHANGED',
        'WORK_DETAILS_UPDATED',
        'TASK_ARCHIVED'
    )),
    CONSTRAINT chk_maintenance_activity_previous_status CHECK (
        previous_status IS NULL OR previous_status IN (
            'SCHEDULED', 'IN_PROGRESS', 'NEEDS_PART', 'ON_HOLD', 'COMPLETED'
        )
    ),
    CONSTRAINT chk_maintenance_activity_new_status CHECK (
        new_status IS NULL OR new_status IN (
            'SCHEDULED', 'IN_PROGRESS', 'NEEDS_PART', 'ON_HOLD', 'COMPLETED'
        )
    ),
    INDEX idx_maintenance_activity_task_timeline (task_id, hospital_id, sequence_number),
    INDEX idx_maintenance_activity_hospital_time (hospital_id, occurred_at),
    INDEX idx_maintenance_activity_type (event_type)
);
