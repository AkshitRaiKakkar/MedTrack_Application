package com.medtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

/** Append-only evidence for one business change to a maintenance task. */
@Entity
@Table(name = "maintenance_task_activities", uniqueConstraints =
        @UniqueConstraint(name = "uk_maintenance_activity_sequence",
                columnNames = {"task_id", "sequence_number"}))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MaintenanceTaskActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false, updatable = false)
    @ToString.Exclude
    private MaintenanceTask task;

    @Column(name = "task_id", insertable = false, updatable = false)
    private Long taskId;

    @NotNull
    @Positive
    @Column(name = "hospital_id", nullable = false, updatable = false)
    private Long hospitalId;

    @NotNull
    @Positive
    @Column(name = "sequence_number", nullable = false, updatable = false)
    private Long sequenceNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50, updatable = false)
    private MaintenanceActivityType eventType;

    @Column(name = "actor_user_id", updatable = false)
    private Long actorUserId;

    @NotBlank
    @Size(max = 255)
    @Column(name = "actor_email", nullable = false, length = 255, updatable = false)
    private String actorEmail;

    @NotBlank
    @Size(max = 50)
    @Column(name = "actor_role", nullable = false, length = 50, updatable = false)
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50, updatable = false)
    private MaintenanceStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 50, updatable = false)
    private MaintenanceStatus newStatus;

    @Size(max = 255)
    @Column(name = "previous_assignee", length = 255, updatable = false)
    private String previousAssignee;

    @Size(max = 255)
    @Column(name = "new_assignee", length = 255, updatable = false)
    private String newAssignee;

    @NotBlank
    @Size(max = 500)
    @Column(name = "changed_fields", nullable = false, length = 500, updatable = false)
    private String changedFields;

    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500, updatable = false)
    private String summary;

    @NotNull
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;
}
