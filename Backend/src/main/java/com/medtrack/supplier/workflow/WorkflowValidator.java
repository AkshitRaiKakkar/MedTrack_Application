package com.medtrack.supplier.workflow;

import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.supplier.model.ShipmentStatus;
import org.springframework.stereotype.Component;

@Component
public class WorkflowValidator {

    public void validateStatusTransition(ShipmentStatus currentStatus, ShipmentStatus requestedStatus) {
        if (currentStatus == requestedStatus) {
            throw new InvalidStatusTransitionException("State transition from " + currentStatus + " to "
                    + requestedStatus + " is same-state and not allowed.");
        }

        if (requestedStatus.ordinal() < currentStatus.ordinal()) {
            throw new InvalidStatusTransitionException(
                    "Cannot revert status from " + currentStatus + " to " + requestedStatus);
        }

        boolean isValidTransition = false;
        if (currentStatus == ShipmentStatus.PENDING && requestedStatus == ShipmentStatus.CONFIRMED) {
            isValidTransition = true;
        } else if (currentStatus == ShipmentStatus.CONFIRMED && requestedStatus == ShipmentStatus.SHIPPED) {
            isValidTransition = true;
        } else if (currentStatus == ShipmentStatus.SHIPPED && requestedStatus == ShipmentStatus.DELIVERED) {
            isValidTransition = true;
        }

        if (!isValidTransition) {
            throw new InvalidStatusTransitionException(
                    "Invalid status transition from " + currentStatus + " to " + requestedStatus);
        }
    }
}
