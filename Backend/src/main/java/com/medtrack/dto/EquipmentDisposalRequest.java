package com.medtrack.dto;

import com.medtrack.model.EquipmentDisposalMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Payload for requesting the decommissioning of an asset (issue #744).
 *
 * <p>The disposal method and reason are mandatory so the request can be reviewed and the
 * certificate of disposal can state how and why the asset left the organisation. Whether the
 * device stored patient or operational data is captured up front so the approval queue can flag
 * devices that still need a data-sanitisation confirmation.</p>
 */
@Data
public class EquipmentDisposalRequest {

    @NotNull(message = "Disposal method is required")
    private EquipmentDisposalMethod disposalMethod;

    private String disposalReason;

    private LocalDate effectiveDate;

    private Boolean storesPatientData;

    private String dataSanitizationDetails;

    private String notes;
}
