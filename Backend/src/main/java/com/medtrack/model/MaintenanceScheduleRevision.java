package com.medtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.medtrack.validation.MaintenanceValidationLimits.AMENDMENT_REASON_MAX_LENGTH;
import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/** Append-only evidence containing the complete schedule before and after an amendment. */
@Entity
@Table(name = "maintenance_schedule_revisions", uniqueConstraints =
        @UniqueConstraint(name = "uk_maintenance_schedule_revision",
                columnNames = {"task_id", "revision_number"}))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MaintenanceScheduleRevision {

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
    @Column(name = "revision_number", nullable = false, updatable = false)
    private Integer revisionNumber;

    @Column(name = "actor_user_id", updatable = false)
    private Long actorUserId;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "actor_email", nullable = false, length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String actorEmail;

    @NotBlank
    @Size(max = AMENDMENT_REASON_MAX_LENGTH)
    @Column(nullable = false, length = AMENDMENT_REASON_MAX_LENGTH, updatable = false)
    private String reason;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "changed_fields", nullable = false, length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String changedFields;

    @NotNull
    @Column(name = "previous_deadline", nullable = false, updatable = false)
    private LocalDate previousDeadline;

    @NotNull
    @Column(name = "new_deadline", nullable = false, updatable = false)
    private LocalDate newDeadline;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "previous_maintenance_type", nullable = false,
            length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String previousMaintenanceType;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "new_maintenance_type", nullable = false,
            length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String newMaintenanceType;

    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "previous_description", length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String previousDescription;

    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "new_description", length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String newDescription;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "previous_priority", nullable = false,
            length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String previousPriority;

    @NotBlank
    @Size(max = SHORT_TEXT_MAX_LENGTH)
    @Column(name = "new_priority", nullable = false,
            length = SHORT_TEXT_MAX_LENGTH, updatable = false)
    private String newPriority;

    @Column(name = "previous_recurrence_period_days", updatable = false)
    private Integer previousRecurrencePeriodDays;

    @Column(name = "new_recurrence_period_days", updatable = false)
    private Integer newRecurrencePeriodDays;

    @NotNull
    @Column(name = "amended_at", nullable = false, updatable = false)
    private LocalDateTime amendedAt;
}
