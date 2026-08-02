package com.medtrack.dto;

import com.medtrack.model.MaintenanceTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Result of previewing or running the generation engine for one rule.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RulePreviewResponse {

    private Long ruleId;
    private String ruleName;
    private LocalDate windowStart;
    private LocalDate windowEnd;
    private int totalDueDates;
    private int matchedEquipment;
    private int wouldCreate;
    private int skippedExisting;
    private List<LocalDate> dueDates;
    private List<String> matchedEquipmentCodes;
    private List<MaintenanceTask> generatedTasks;
}
