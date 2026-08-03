package com.medtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Result of a dry-run (preview) bulk import: every row the file would commit, plus every row
 * that would be rejected and why. Nothing is written to the database by the preview.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentImportPreviewResponse {

    private int totalRows;
    private int validCount;
    private int failureCount;
    private List<PreviewRow> validRows;
    private List<EquipmentImportSummary.RowFailure> failures;

    /**
     * One row the import would commit, keyed by the canonical CSV header (e.g. {@code "Name"}).
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PreviewRow {
        private int rowNumber;
        private Map<String, String> data;
    }
}
