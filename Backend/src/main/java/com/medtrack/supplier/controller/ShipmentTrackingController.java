package com.medtrack.supplier.controller;

import com.medtrack.dto.PagedResponse;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPLIER')")
@Tag(name = "Shipment Tracking", description = "Endpoints for managing and querying shipment tracking records for supplier orders.")
public class ShipmentTrackingController {

    private final ShipmentTrackingService shipmentTrackingService;

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ShipmentTrackingResponse> createShipment(@Valid @RequestBody CreateShipmentRequest request,
            Authentication authentication) {
        ShipmentTrackingResponse response = shipmentTrackingService.createShipment(request, authentication);
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
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<ShipmentTrackingResponse> updateShipmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentStatusRequest request,
            Authentication authentication) {
        ShipmentTrackingResponse response = shipmentTrackingService.updateShipmentStatus(id, request, authentication);
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
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<ShipmentTrackingResponse> getShipmentById(@PathVariable Long id,
            Authentication authentication) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentById(id, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tracking/{trackingNumber}")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<ShipmentTrackingResponse> getShipmentByTrackingNumber(@PathVariable String trackingNumber,
            Authentication authentication) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentByTrackingNumber(trackingNumber, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'SUPPLIER')")
    public ResponseEntity<ShipmentTrackingResponse> getShipmentByOrderId(@PathVariable Long orderId,
            Authentication authentication) {
        ShipmentTrackingResponse response = shipmentTrackingService.getShipmentByOrderId(orderId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<PagedResponse<ShipmentTrackingResponse>> getShipmentsBySupplier(
            @PathVariable Long supplierId,
            @PageableDefault(sort = "createdAt") Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(
                PagedResponse.of(shipmentTrackingService.getShipmentsBySupplier(supplierId, pageable, authentication)));
    }
}
