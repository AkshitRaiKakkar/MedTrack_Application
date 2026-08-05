package com.medtrack.dto;

import lombok.Data;

/**
 * Data-sanitisation confirmation for a device that stored patient or operational data (issue
 * #744). Only accepted once the disposal has been approved, and it stamps the acting user and
 * timestamp so the audit trail records who confirmed the wipe and when.
 */
@Data
public class DataSanitizationRequest {
    private String details;
}
