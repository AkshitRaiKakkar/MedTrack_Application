package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Immutable before/after snapshot returned for one schedule amendment. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleRevisionResponse {
    private Long id;
    private Long taskId;
    private Integer revisionNumber;
    private Long actorUserId;
    private String actorEmail;
    private String reason;
    private List<String> changedFields;
    private LocalDate previousDeadline;
    private LocalDate newDeadline;
    private String previousMaintenanceType;
    private String newMaintenanceType;
    private String previousDescription;
    private String newDescription;
    private String previousPriority;
    private String newPriority;
    private Integer previousRecurrencePeriodDays;
    private Integer newRecurrencePeriodDays;
    private LocalDateTime amendedAt;
}
