package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Stable page envelope for schedule-revision audit history. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleRevisionPageResponse {
    private List<MaintenanceScheduleRevisionResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}
