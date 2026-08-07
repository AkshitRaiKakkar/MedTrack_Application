package com.medtrack.supplier.controller;

import com.medtrack.supplier.dto.CreateShipmentRequest;
import com.medtrack.supplier.dto.ShipmentTrackingResponse;
import com.medtrack.supplier.dto.UpdateShipmentStatusRequest;
import com.medtrack.supplier.service.ShipmentTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPLIER')")
@Tag(name = "Shipment Tracking", description = "Endpoints for managing and querying shipment tracking records for supplier orders.")
public class ShipmentTrackingController {

    private final ShipmentTrackingService shipmentTrackingService;

    @PostMapping
    @Operation(summary = "Create shipment tracking", description = "Creates a new shipment tracking record for an existing confirmed order.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Shipment created successfully", content = @Content(schema = @Schema(implementation = ShipmentTrackingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or duplicate tracking data")
    })
    public ResponseEntity<ShipmentTrackingResponse> createShipment(@Valid @RequestBody CreateShipmentRequest request) {
        ShipmentTrackingResponse response = shipmentTrackingService.createShipment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk-create")
    @Operation(summary = "Bulk create shipment tracking", description = "Creates multiple shipment tracking records simultaneously.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Shipments created successfully", content = @Content(schema = @Schema(implementation = List.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or duplicate tracking data")
    })
    public ResponseEntity<List<ShipmentTrackingResponse>> bulkCreateShipments(
            @Valid @RequestBody com.medtrack.supplier.dto.BulkShipmentConfirmationRequest request) {
        List<ShipmentTrackingResponse> response = shipmentTrackingService.bulkConfirmShipments(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update shipment status", description = "Updates the shipping status of an existing shipment record and propagates state to the parent order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipment status updated", content = @Content(schema = @Schema(implementation = ShipmentTrackingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid status transition"),
            @ApiResponse(responseCode = "404", description = "Shipment record not found")
    })
    public ResponseEntity<ShipmentTrackingResponse> updateShipmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentStatusRequest request) {
        ShipmentTrackingResponse response = shipmentTrackingService.updateShipmentStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/bulk-delivery")
    @Operation(summary = "Bulk update delivery status", description = "Updates delivery status to DELIVERED for multiple shipments.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipments updated successfully", content = @Content(schema = @Schema(implementation = List.class))),
            @ApiResponse(responseCode = "400", description = "Invalid status transition")
    })
    public ResponseEntity<List<ShipmentTrackingResponse>> bulkConfirmDeliveries(
            @Valid @RequestBody com.medtrack.supplier.dto.BulkDeliveryConfirmationRequest request) {
        List<ShipmentTrackingResponse> response = shipmentTrackingService.bulkConfirmDeliveries(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get shipment by ID", description = "Retrieves a specific shipment tracking record by its internal unique identifier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipment retrieved successfully", content = @Content(schema = @Schema(implementation = ShipmentTrackingResponse.class))),
            @ApiResponse(responseCode = "404", description = "Shipment record not found")
    })
    public ResponseEntity<ShipmentTrackingResponse> getShipmentById(@PathVariable Long id) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tracking/{trackingNumber}")
    @Operation(summary = "Get shipment by tracking number", description = "Retrieves a shipment based on its tracking number.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipment retrieved successfully", content = @Content(schema = @Schema(implementation = ShipmentTrackingResponse.class))),
            @ApiResponse(responseCode = "404", description = "Shipment record not found")
    })
    public ResponseEntity<ShipmentTrackingResponse> getShipmentByTrackingNumber(@PathVariable String trackingNumber) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get shipment by order ID", description = "Retrieves the shipping record associated with a specific order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipment retrieved successfully", content = @Content(schema = @Schema(implementation = ShipmentTrackingResponse.class))),
            @ApiResponse(responseCode = "404", description = "Shipment record not found")
    })
    public ResponseEntity<ShipmentTrackingResponse> getShipmentByOrderId(@PathVariable Long orderId) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/supplier/{supplierId}")
    @Operation(summary = "Get all shipments for a supplier", description = "Retrieves a list of all shipments handled by a specific supplier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shipments retrieved successfully")
    })
    public ResponseEntity<List<ShipmentTrackingResponse>> getShipmentsBySupplier(@PathVariable Long supplierId) {
        List<ShipmentTrackingResponse> response = shipmentTrackingService.getShipmentsBySupplier(supplierId);
        return ResponseEntity.ok(response);
    }
}
