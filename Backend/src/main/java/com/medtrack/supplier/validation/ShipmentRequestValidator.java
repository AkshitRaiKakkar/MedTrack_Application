package com.medtrack.supplier.validation;

import com.medtrack.supplier.dto.CreateShipmentRequest;
import com.medtrack.supplier.dto.UpdateShipmentStatusRequest;
import com.medtrack.supplier.model.ShipmentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Dedicated validator component enforcing business rules, payload integrity,
 * and date boundary validations for supplier shipment operations.
 */
@Component
public class ShipmentRequestValidator {

    /**
     * Validates incoming shipment creation request payloads.
     *
     * @param request the create shipment request payload
     * @throws IllegalArgumentException if any validation boundary is violated
     */
    public void validateCreateShipmentRequest(CreateShipmentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Shipment request payload cannot be null");
        }
        if (request.getOrderId() == null || request.getOrderId() <= 0) {
            throw new IllegalArgumentException("Valid positive Order ID is required for creating a shipment");
        }
        if (request.getShipmentTrackingNumber() == null || request.getShipmentTrackingNumber().isBlank()) {
            throw new IllegalArgumentException("Shipment tracking number is required and cannot be blank");
        }
        if (request.getCarrier() == null || request.getCarrier().isBlank()) {
            throw new IllegalArgumentException("Shipment carrier is required and cannot be blank");
        }
        if (request.getEstimatedDeliveryDate() == null) {
            throw new IllegalArgumentException("Estimated delivery date is required");
        }
        if (request.getEstimatedDeliveryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Estimated delivery date cannot be in the past");
        }
    }

    /**
     * Validates shipment status update request payloads.
     *
     * @param request the status update request payload
     * @throws IllegalArgumentException if request is null or status value is blank/invalid
     */
    public void validateUpdateStatusRequest(UpdateShipmentStatusRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update shipment status request payload cannot be null");
        }
        if (request.getShipmentStatus() == null || request.getShipmentStatus().isBlank()) {
            throw new IllegalArgumentException("Shipment status value is required and cannot be blank");
        }
        try {
            ShipmentStatus.valueOf(request.getShipmentStatus().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid shipment status value: " + request.getShipmentStatus());
        }
    }

    /**
     * Validates entity identifiers (e.g., shipment ID, order ID, supplier ID).
     *
     * @param id the entity identifier
     * @param entityName the human-readable entity name for logging and exception details
     * @throws IllegalArgumentException if the ID is null or non-positive
     */
    public void validateEntityId(Long id, String entityName) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid " + entityName + " ID: " + id);
        }
    }

    /**
     * Validates shipment tracking numbers.
     *
     * @param trackingNumber the shipment tracking number
     * @throws IllegalArgumentException if the tracking number is null or blank
     */
    public void validateTrackingNumber(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw new IllegalArgumentException("Tracking number cannot be null or blank");
        }
    }
}
