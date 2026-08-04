package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * A single run of the preventive-maintenance generation job for one rule.
 *
 * <p>The run records the window that was evaluated, how many exact equipment/deadline occurrences
 * were created or already present, and an idempotency key for an identical rule/window request.</p>
 */
@Entity
@Table(name = "maintenance_generation_runs",
        uniqueConstraints = @UniqueConstraint(name = "uk_generation_run_window", columnNames = {
                "hospital_id", "policy_rule_id", "window_start", "window_end"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceGenerationRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "policy_rule_id", nullable = false)
    private Long policyRuleId;

    @Column(name = "window_start", nullable = false)
    private LocalDate windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalDate windowEnd;

    @Column(name = "tasks_generated", nullable = false)
    private Integer tasksGenerated;

    @Column(name = "skipped_existing", nullable = false)
    @Builder.Default
    private Integer skippedExisting = 0;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Status detail must not exceed 255 characters")
    @Column(length = SHORT_TEXT_MAX_LENGTH)
    private String detail;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
