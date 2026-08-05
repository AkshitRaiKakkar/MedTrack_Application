package com.medtrack.supplier.validation;

import com.medtrack.supplier.dto.CreateShipmentRequest;
import com.medtrack.supplier.dto.UpdateShipmentStatusRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class ShipmentRequestValidatorTest {

    private ShipmentRequestValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ShipmentRequestValidator();
    }

    @Test
    void validateCreateShipmentRequest_ValidPayload_DoesNotThrow() {
        CreateShipmentRequest request = CreateShipmentRequest.builder()
                .orderId(10L)
                .shipmentTrackingNumber("TRK-98765")
                .carrier("DHL Express")
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(5))
                .build();

        assertDoesNotThrow(() -> validator.validateCreateShipmentRequest(request));
    }

    @Test
    void validateCreateShipmentRequest_NullPayload_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(null));
    }

    @Test
    void validateCreateShipmentRequest_NullOrZeroOrderId_ThrowsException() {
        CreateShipmentRequest nullOrderReq = CreateShipmentRequest.builder()
                .orderId(null)
                .shipmentTrackingNumber("TRK-1")
                .carrier("DHL")
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(2))
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(nullOrderReq));

        CreateShipmentRequest zeroOrderReq = CreateShipmentRequest.builder()
                .orderId(0L)
                .shipmentTrackingNumber("TRK-1")
                .carrier("DHL")
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(2))
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(zeroOrderReq));
    }

    @Test
    void validateCreateShipmentRequest_BlankTrackingOrCarrier_ThrowsException() {
        CreateShipmentRequest blankTracking = CreateShipmentRequest.builder()
                .orderId(1L)
                .shipmentTrackingNumber("   ")
                .carrier("DHL")
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(2))
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(blankTracking));

        CreateShipmentRequest blankCarrier = CreateShipmentRequest.builder()
                .orderId(1L)
                .shipmentTrackingNumber("TRK-1")
                .carrier("  ")
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(2))
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(blankCarrier));
    }

    @Test
    void validateCreateShipmentRequest_PastOrNullDate_ThrowsException() {
        CreateShipmentRequest nullDateReq = CreateShipmentRequest.builder()
                .orderId(1L)
                .shipmentTrackingNumber("TRK-1")
                .carrier("DHL")
                .estimatedDeliveryDate(null)
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(nullDateReq));

        CreateShipmentRequest pastDateReq = CreateShipmentRequest.builder()
                .orderId(1L)
                .shipmentTrackingNumber("TRK-1")
                .carrier("DHL")
                .estimatedDeliveryDate(LocalDateTime.now().minusDays(2))
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateCreateShipmentRequest(pastDateReq));
    }

    @Test
    void validateUpdateStatusRequest_ValidStatus_DoesNotThrow() {
        UpdateShipmentStatusRequest request = UpdateShipmentStatusRequest.builder()
                .shipmentStatus("SHIPPED")
                .build();

        assertDoesNotThrow(() -> validator.validateUpdateStatusRequest(request));
    }

    @Test
    void validateUpdateStatusRequest_InvalidOrBlankStatus_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> validator.validateUpdateStatusRequest(null));

        UpdateShipmentStatusRequest blankReq = UpdateShipmentStatusRequest.builder()
                .shipmentStatus("   ")
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateUpdateStatusRequest(blankReq));

        UpdateShipmentStatusRequest invalidReq = UpdateShipmentStatusRequest.builder()
                .shipmentStatus("UNKNOWN_STATUS")
                .build();
        assertThrows(IllegalArgumentException.class, () -> validator.validateUpdateStatusRequest(invalidReq));
    }

    @Test
    void validateEntityIdAndTrackingNumber_InvalidInputs_ThrowException() {
        assertThrows(IllegalArgumentException.class, () -> validator.validateEntityId(null, "Test"));
        assertThrows(IllegalArgumentException.class, () -> validator.validateEntityId(-1L, "Test"));
        assertThrows(IllegalArgumentException.class, () -> validator.validateTrackingNumber(null));
        assertThrows(IllegalArgumentException.class, () -> validator.validateTrackingNumber("  "));
    }
}
