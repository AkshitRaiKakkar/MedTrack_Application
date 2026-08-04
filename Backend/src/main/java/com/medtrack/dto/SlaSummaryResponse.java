package com.medtrack.dto;

import com.medtrack.model.MaintenanceTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * SLA dashboard aggregate for a hospital: counts per state plus the offending task lists.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaSummaryResponse {

    private long upcoming;
    private long warning;
    private long breached;
    private long escalated;
    private long completedOnTime;
    private long completedLate;
    private double complianceRate;

    private List<MaintenanceTask> warningTasks;
    private List<MaintenanceTask> breachedTasks;
    private List<MaintenanceTask> escalatedTasks;
}
