package com.medtrack.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.medtrack.validation.MaintenanceValidationLimits.SHORT_TEXT_MAX_LENGTH;

/**
 * A preventive-maintenance recurrence rule owned by a hospital.
 *
 * <p>A rule selects a set of equipment through its {@link MaintenanceRuleScope} and associated
 * selector, describes how often those assets need service via {@link RecurrenceFrequency}, and
 * encodes the hospital's service-level expectations ({@code slaWarningDays}/{@code slaBreachDays})
 * so generated tasks can be measured and escalated consistently.</p>
 */
@Entity
@Table(name = "maintenance_policy_rules")
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePolicyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stable ownership key used by the service to isolate one hospital's rules from another.
    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @NotBlank(message = "Rule name is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Rule name must not exceed 255 characters")
    @Column(length = SHORT_TEXT_MAX_LENGTH, nullable = false)
    private String name;

    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Rule description must not exceed 255 characters")
    @Column(length = SHORT_TEXT_MAX_LENGTH)
    private String description;

    @NotNull(message = "Rule scope is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "rule_scope", length = 50, nullable = false)
    private MaintenanceRuleScope ruleScope;

    // Selector for EQUIPMENT_CATEGORY scope rules.
    @Enumerated(EnumType.STRING)
    @Column(name = "equipment_category", length = 50)
    private EquipmentCategory equipmentCategory;

    // Selector for INDIVIDUAL_EQUIPMENT scope rules.
    @Column(name = "equipment_record_id")
    private Long equipmentRecordId;

    // Selector for MANUFACTURER_INTERVAL scope rules.
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Manufacturer must not exceed 255 characters")
    @Column(length = SHORT_TEXT_MAX_LENGTH)
    private String manufacturer;

    // Selector for PRIORITY scope rules: the maintenance priority generated tasks carry.
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Priority must not exceed 255 characters")
    @Column(length = SHORT_TEXT_MAX_LENGTH)
    private String priority;

    @NotNull(message = "Recurrence frequency is required")
    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private RecurrenceFrequency frequency;

    // Interval in days used by CUSTOM frequency rules (or any frequency whose period is expressed in days).
    @Positive(message = "Custom interval must be positive")
    @Column(name = "custom_interval_days")
    private Integer customIntervalDays;

    @NotBlank(message = "Maintenance type is required")
    @Size(max = SHORT_TEXT_MAX_LENGTH, message = "Maintenance type must not exceed 255 characters")
    @Column(name = "maintenance_type", length = SHORT_TEXT_MAX_LENGTH, nullable = false)
    private String maintenanceType;

    // SLA: the number of days before the deadline at which a task enters WARNING.
    @PositiveOrZero(message = "SLA warning days cannot be negative")
    @Column(name = "sla_warning_days", nullable = false)
    @Builder.Default
    private Integer slaWarningDays = 3;

    // SLA: the number of days after the deadline at which a task enters BREACHED.
    @PositiveOrZero(message = "SLA breach days cannot be negative")
    @Column(name = "sla_breach_days", nullable = false)
    @Builder.Default
    private Integer slaBreachDays = 1;

    // How far ahead of the next due date a task should be generated, in days.
    @Positive(message = "Lead time must be positive")
    @Column(name = "lead_time_days", nullable = false)
    @Builder.Default
    private Integer leadTimeDays = 7;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    // Latest generation window end successfully evaluated for operator visibility. Recurrence
    // cadence is reconstructed from retained generated-task deadlines, not from this audit field.
    @Column(name = "last_generated_at")
    private LocalDate lastGeneratedAt;

    /**
     * Soft delete fields - records are never hard deleted for audit compliance.
     */
    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 255)
    private String deletedBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
