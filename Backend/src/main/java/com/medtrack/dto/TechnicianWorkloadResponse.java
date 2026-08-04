package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Technician workload and workload-aware assignment suggestions for a hospital.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianWorkloadResponse {

    private List<TechnicianWorkloadItem> technicians;
    private List<AssignmentSuggestion> suggestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicianWorkloadItem {
        private Long technicianId;
        private String technicianEmail;
        private long openTasks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentSuggestion {
        private Long taskId;
        private String taskCode;
        private String equipment;
        private String priority;
        private java.time.LocalDate deadline;
        private Long suggestedTechnicianId;
        private String suggestedTechnicianEmail;
        private long suggestedTechnicianOpenTasks;
        private String reason;
    }
}
