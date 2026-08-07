package com.medtrack.supplier.workflow;

import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.supplier.model.ShipmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class WorkflowValidatorTest {

    private WorkflowValidator validator;

    @BeforeEach
    void setUp() {
        validator = new WorkflowValidator();
    }

    @Test
    void testValidTransitions() {
        assertDoesNotThrow(() -> validator.validateStatusTransition(ShipmentStatus.PENDING, ShipmentStatus.CONFIRMED));
        assertDoesNotThrow(() -> validator.validateStatusTransition(ShipmentStatus.CONFIRMED, ShipmentStatus.SHIPPED));
        assertDoesNotThrow(() -> validator.validateStatusTransition(ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED));
    }

    @Test
    void testInvalidRevertTransitions() {
        assertThrows(InvalidStatusTransitionException.class,
                () -> validator.validateStatusTransition(ShipmentStatus.SHIPPED, ShipmentStatus.CONFIRMED));
        assertThrows(InvalidStatusTransitionException.class,
                () -> validator.validateStatusTransition(ShipmentStatus.DELIVERED, ShipmentStatus.PENDING));
    }

    @Test
    void testInvalidSkipTransitions() {
        assertThrows(InvalidStatusTransitionException.class,
                () -> validator.validateStatusTransition(ShipmentStatus.PENDING, ShipmentStatus.SHIPPED));
        assertThrows(InvalidStatusTransitionException.class,
                () -> validator.validateStatusTransition(ShipmentStatus.PENDING, ShipmentStatus.DELIVERED));
    }

    @Test
    void testSameStateTransition() {
        assertThrows(InvalidStatusTransitionException.class,
                () -> validator.validateStatusTransition(ShipmentStatus.PENDING, ShipmentStatus.PENDING));
    }
}
