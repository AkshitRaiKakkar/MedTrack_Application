package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medtrack.model.ReceivingCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Hospital-side receiving record for a delivered procurement request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReceivingRecordRequest {

    @NotNull(message = "Quantity received is required")
    @Positive(message = "Quantity received must be at least 1")
    private Integer quantityReceived;

    private ReceivingCondition condition;

    @Size(max = 1000, message = "Serial numbers must not exceed 1000 characters")
    private String serialNumbers;

    private LocalDate warrantyExpiry;

    @Size(max = 16000, message = "Discrepancy notes must not exceed 16000 characters")
    private String discrepancyNotes;
}
