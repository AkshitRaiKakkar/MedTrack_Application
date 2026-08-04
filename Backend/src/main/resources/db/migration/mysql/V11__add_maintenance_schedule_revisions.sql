ALTER TABLE maintenance_tasks
    ADD COLUMN schedule_revision INT NOT NULL DEFAULT 0;

ALTER TABLE maintenance_tasks
    ADD CONSTRAINT chk_maintenance_schedule_revision
        CHECK (schedule_revision >= 0);

CREATE TABLE maintenance_schedule_revisions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    revision_number INT NOT NULL,
    actor_user_id BIGINT NULL,
    actor_email VARCHAR(255) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    changed_fields VARCHAR(255) NOT NULL,
    previous_deadline DATE NOT NULL,
    new_deadline DATE NOT NULL,
    previous_maintenance_type VARCHAR(255) NOT NULL,
    new_maintenance_type VARCHAR(255) NOT NULL,
    previous_description VARCHAR(255) NULL,
    new_description VARCHAR(255) NULL,
    previous_priority VARCHAR(255) NOT NULL,
    new_priority VARCHAR(255) NOT NULL,
    previous_recurrence_period_days INT NULL,
    new_recurrence_period_days INT NULL,
    amended_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_maintenance_schedule_revision
        UNIQUE (task_id, revision_number),
    CONSTRAINT fk_maintenance_revision_task
        FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
    CONSTRAINT fk_maintenance_revision_hospital
        FOREIGN KEY (hospital_id) REFERENCES hospital(id),
    CONSTRAINT fk_maintenance_revision_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_maintenance_revision_number
        CHECK (revision_number > 0),
    CONSTRAINT chk_maintenance_revision_previous_recurrence
        CHECK (previous_recurrence_period_days IS NULL
            OR previous_recurrence_period_days >= 0),
    CONSTRAINT chk_maintenance_revision_new_recurrence
        CHECK (new_recurrence_period_days IS NULL
            OR new_recurrence_period_days >= 0),
    CONSTRAINT chk_maintenance_revision_previous_priority
        CHECK (previous_priority IN ('Normal', 'High', 'Critical')),
    CONSTRAINT chk_maintenance_revision_new_priority
        CHECK (new_priority IN ('Normal', 'High', 'Critical')),
    INDEX idx_maintenance_revision_task_timeline
        (task_id, hospital_id, revision_number),
    INDEX idx_maintenance_revision_hospital_time
        (hospital_id, amended_at)
);

ALTER TABLE maintenance_task_activities
    DROP CHECK chk_maintenance_activity_type;

ALTER TABLE maintenance_task_activities
    ADD CONSTRAINT chk_maintenance_activity_type CHECK (event_type IN (
        'TASK_CREATED',
        'TECHNICIAN_ASSIGNED',
        'TECHNICIAN_REASSIGNED',
        'STATUS_CHANGED',
        'WORK_DETAILS_UPDATED',
        'SCHEDULE_AMENDED',
        'TASK_ARCHIVED'
    ));
