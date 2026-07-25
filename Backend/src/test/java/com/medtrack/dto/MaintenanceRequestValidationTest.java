package com.medtrack.dto;

import com.medtrack.model.MaintenanceStatus;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MaintenanceRequestValidationTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createRequestRejectsTextThatExceedsPersistenceLimits() {
        MaintenanceCreateRequest request = MaintenanceCreateRequest.builder()
                .equipmentId("E".repeat(256))
                .maintenanceType("Inspection")
                .deadline(LocalDate.now())
                .priority("Normal")
                .build();

        var violations = validator.validate(request);

        assertEquals(1, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("equipmentId")
                        && violation.getMessage().equals(
                        "Equipment ID must not exceed 255 characters")));
    }

    @Test
    void updateRequestRejectsOversizedReportFields() {
        MaintenanceUpdateRequest request = MaintenanceUpdateRequest.builder()
                .status(MaintenanceStatus.IN_PROGRESS)
                .notes("N".repeat(16_001))
                .partsUsed("P".repeat(256))
                .signature("S".repeat(60_001))
                .build();

        var violations = validator.validate(request);

        assertEquals(3, violations.size());
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("notes")));
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("partsUsed")));
        assertTrue(violations.stream().anyMatch(violation ->
                violation.getPropertyPath().toString().equals("signature")));
    }
}
