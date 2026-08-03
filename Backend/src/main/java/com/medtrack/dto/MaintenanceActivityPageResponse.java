package com.medtrack.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/**
 * Explicit page envelope used by the new history endpoint. Existing task-list
 * endpoints retain their established JSON-array contract.
 */
@Value
@Builder
public class MaintenanceActivityPageResponse {
    List<MaintenanceActivityResponse> content;
    int page;
    int size;
    long totalElements;
    int totalPages;
    boolean first;
    boolean last;
}
