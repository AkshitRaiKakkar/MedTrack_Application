-- Flyway migration V13: Add per-user notification category mute preferences (MySQL)

CREATE TABLE notification_preferences (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(32) NOT NULL,
    muted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notification_preferences_user_category UNIQUE (user_id, category)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
