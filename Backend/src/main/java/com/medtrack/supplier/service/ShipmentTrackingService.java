package com.medtrack.supplier.service;

import com.medtrack.exception.DuplicateTrackingNumberException;
import com.medtrack.exception.InvalidStatusTransitionException;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.dto.BulkDeliveryConfirmationRequest;
import com.medtrack.supplier.dto.BulkShipmentConfirmationRequest;
import com.medtrack.supplier.dto.CreateShipmentRequest;
import com.medtrack.supplier.dto.ShipmentTrackingResponse;
import com.medtrack.supplier.dto.UpdateShipmentStatusRequest;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.supplier.validation.ShipmentRequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShipmentTrackingService {

    private final ShipmentTrackingRepository shipmentTrackingRepository;
    private final EquipmentOrderRepository orderRepository;
    private final SupplierAccessGuard supplierAccessGuard;
    private final ShipmentRequestValidator validator;

    @Transactional
    public ShipmentTrackingResponse createShipment(CreateShipmentRequest request, Authentication authentication) {
        validator.validateCreateShipmentRequest(request);

        // 1. Verify associated order exists
        EquipmentOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        // 2. Prevent duplicate shipment creation for same order
        shipmentTrackingRepository.findByOrderId(request.getOrderId()).ifPresent(s -> {
            throw new IllegalArgumentException(
                    "Shipment tracking already exists for Order ID: " + request.getOrderId());
        });

        // 3. Ensure tracking number uniqueness
        shipmentTrackingRepository.findByShipmentTrackingNumber(request.getShipmentTrackingNumber().trim()).ifPresent(s -> {
            throw new DuplicateTrackingNumberException("Tracking number already in use: " + request.getShipmentTrackingNumber());
        });

        // 4. Create and persist ShipmentTracking. The supplierId is always the resolved
        // caller identity, never the client-supplied request field, so a supplier cannot
        // create a shipment claiming to be a different supplier.
        ShipmentTracking shipment = ShipmentTracking.builder()
                .orderId(request.getOrderId())
                .shipmentTrackingNumber(request.getShipmentTrackingNumber().trim())
                .estimatedDeliveryDate(request.getEstimatedDeliveryDate())
                .shipmentStatus(ShipmentStatus.PENDING)
                .supplierId(supplierAccessGuard.resolveCallerId(authentication))
                .createdAt(LocalDateTime.now())
                .build();

        ShipmentTracking savedShipment = shipmentTrackingRepository.save(shipment);

        // 5. Update order details
        order.setTrackingNo(request.getShipmentTrackingNumber().trim());
        order.setCarrier(request.getCarrier().trim());
        order.setStatus("CONFIRMED");
        order.setShippingStatus("Processing");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return mapToResponse(savedShipment);
    }

    @Transactional
    public ShipmentTrackingResponse updateShipmentStatus(Long id, UpdateShipmentStatusRequest request,
            Authentication authentication) {
        validator.validateEntityId(id, "Shipment");
        validator.validateUpdateStatusRequest(request);

        // 1. Retrieve the tracking record
        ShipmentTracking shipment = shipmentTrackingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment tracking not found with ID: " + id));

        // Only the assigned supplier or a HOSPITAL admin may update this shipment.
        supplierAccessGuard.assertSelfOrHospitalAdmin(authentication,
                supplierAccessGuard.resolveCallerId(authentication), shipment.getSupplierId());

        // 2. Map and validate status transition
        ShipmentStatus newStatus;
        try {
            newStatus = ShipmentStatus.valueOf(request.getShipmentStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid shipment status value: " + request.getShipmentStatus());
        }

        ShipmentStatus currentStatus = shipment.getShipmentStatus();
        orchestrator.validateStateTransition(currentStatus, newStatus);

        // 3. Update shipment record
        shipment.setShipmentStatus(newStatus);
        if (newStatus == ShipmentStatus.DELIVERED) {
            shipment.setActualDeliveryDate(LocalDateTime.now());
        }
        shipment.setUpdatedAt(LocalDateTime.now());
        ShipmentTracking updatedShipment = shipmentTrackingRepository.save(shipment);

        // 4. Update associated order
        EquipmentOrder order = orderRepository.findById(shipment.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + shipment.getOrderId()));

        if (newStatus == ShipmentStatus.CONFIRMED) {
            order.setStatus("CONFIRMED");
            order.setShippingStatus("Processing");
        } else if (newStatus == ShipmentStatus.SHIPPED) {
            order.setStatus("IN_TRANSIT");
            order.setShippingStatus("Shipped");
            order.setDispatchedAt(LocalDateTime.now());
        } else if (newStatus == ShipmentStatus.DELIVERED) {
            order.setStatus("DELIVERED");
            order.setShippingStatus("Delivered");
            order.setDeliveredAt(LocalDateTime.now());
        }

        if (request.getSupplierNotes() != null) {
            order.setSupplierNotes(request.getSupplierNotes().trim());
        }
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return mapToResponse(updatedShipment);
    }

    @Transactional
    public List<ShipmentTrackingResponse> bulkConfirmShipments(BulkShipmentConfirmationRequest request) {
        return request.getShipments().stream()
                .map(this::createShipment)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ShipmentTrackingResponse> bulkConfirmDeliveries(BulkDeliveryConfirmationRequest request) {
        UpdateShipmentStatusRequest updateRequest = UpdateShipmentStatusRequest.builder()
                .shipmentStatus("DELIVERED")
                .supplierNotes("Bulk delivery confirmation")
                .build();

        return request.getShipmentIds().stream()
                .map(id -> updateShipmentStatus(id, updateRequest))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShipmentTrackingResponse getShipmentById(Long id, Authentication authentication) {
        validator.validateEntityId(id, "Shipment");
        ShipmentTracking shipment = shipmentTrackingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment tracking not found with ID: " + id));
        assertCanView(authentication, shipment);
        return mapToResponse(shipment);
    }

    @Transactional(readOnly = true)
    public ShipmentTrackingResponse getShipmentByTrackingNumber(String trackingNumber, Authentication authentication) {
        validator.validateTrackingNumber(trackingNumber);
        ShipmentTracking shipment = shipmentTrackingRepository.findByShipmentTrackingNumber(trackingNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Shipment tracking not found for tracking number: " + trackingNumber));
        assertCanView(authentication, shipment);
        return mapToResponse(shipment);
    }

    @Transactional(readOnly = true)
    public ShipmentTrackingResponse getShipmentByOrderId(Long orderId, Authentication authentication) {
        validator.validateEntityId(orderId, "Order");
        ShipmentTracking shipment = shipmentTrackingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment tracking not found for Order ID: " + orderId));
        assertCanView(authentication, shipment);
        return mapToResponse(shipment);
    }

    @Transactional(readOnly = true)
    public Page<ShipmentTrackingResponse> getShipmentsBySupplier(Long supplierId, Pageable pageable, Authentication authentication) {
        validator.validateEntityId(supplierId, "Supplier");
        supplierAccessGuard.assertSelfOrHospitalAdmin(authentication, supplierId);
        return shipmentTrackingRepository.findBySupplierId(supplierId, pageable)
                .map(this::mapToResponse);
    }

    private void assertCanView(Authentication authentication, ShipmentTracking shipment) {
        supplierAccessGuard.assertSelfOrHospitalAdmin(authentication,
                supplierAccessGuard.resolveCallerId(authentication), shipment.getSupplierId());
    }

    private ShipmentTrackingResponse mapToResponse(ShipmentTracking shipment) {
        return ShipmentTrackingResponse.builder()
                .id(shipment.getId())
                .orderId(shipment.getOrderId())
                .shipmentTrackingNumber(shipment.getShipmentTrackingNumber())
                .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
                .actualDeliveryDate(shipment.getActualDeliveryDate())
                .shipmentStatus(shipment.getShipmentStatus().name())
                .supplierId(shipment.getSupplierId())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }
}
