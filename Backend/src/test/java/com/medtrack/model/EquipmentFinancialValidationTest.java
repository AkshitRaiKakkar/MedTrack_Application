package com.medtrack.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EquipmentFinancialValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void negativePurchaseCostIsRejected() {
        Equipment equipment = validEquipment();
        equipment.setPurchaseCost(new BigDecimal("-0.01"));

        Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

        assertEquals(1, violations.size());
        ConstraintViolation<Equipment> violation = violations.iterator().next();
        assertEquals("purchaseCost", violation.getPropertyPath().toString());
        assertEquals("Purchase cost cannot be negative", violation.getMessage());
    }

    @Test
    void zeroPurchaseCostIsAccepted() {
        Equipment equipment = validEquipment();
        equipment.setPurchaseCost(BigDecimal.ZERO);

        assertTrue(validator.validate(equipment).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(ints = {-100, -1, 0})
    void nonPositiveUsefulLifeIsRejected(int usefulLifeYears) {
        Equipment equipment = validEquipment();
        equipment.setUsefulLifeYears(usefulLifeYears);

        Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

        assertEquals(1, violations.size());
        ConstraintViolation<Equipment> violation = violations.iterator().next();
        assertEquals("usefulLifeYears", violation.getPropertyPath().toString());
        assertEquals("Useful life must be a positive number of years", violation.getMessage());
    }

    @Test
    void oneYearUsefulLifeIsAcceptedForDecliningBalance() {
        Equipment equipment = validEquipment();
        equipment.setUsefulLifeYears(1);
        equipment.setDepreciationMethod(DepreciationMethod.DECLINING_BALANCE);

        assertTrue(validator.validate(equipment).isEmpty());
    }

    @Test
    void omittedFinancialFieldsRemainValid() {
        Equipment equipment = validEquipment();
        equipment.setPurchaseCost(null);
        equipment.setUsefulLifeYears(null);
        equipment.setDepreciationMethod(null);

        assertTrue(validator.validate(equipment).isEmpty());
    }

    @Test
    void purchaseCostAndUsefulLifeFailuresAreReportedTogether() {
        Equipment equipment = validEquipment();
        equipment.setPurchaseCost(new BigDecimal("-500.00"));
        equipment.setUsefulLifeYears(0);

        Set<ConstraintViolation<Equipment>> violations = validator.validate(equipment);

        assertEquals(2, violations.size());
        assertTrue(violations.stream()
                .anyMatch(violation -> "purchaseCost".equals(violation.getPropertyPath().toString())));
        assertTrue(violations.stream()
                .anyMatch(violation -> "usefulLifeYears".equals(violation.getPropertyPath().toString())));
    }

    private static Equipment validEquipment() {
        return Equipment.builder()
                .name("Infusion Pump")
                .department("Critical Care")
                .purchaseCost(new BigDecimal("1000.00"))
                .usefulLifeYears(5)
                .depreciationMethod(DepreciationMethod.STRAIGHT_LINE)
                .build();
    }
}
