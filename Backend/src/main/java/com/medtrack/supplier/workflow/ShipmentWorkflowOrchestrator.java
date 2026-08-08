package com.medtrack.supplier.workflow;

import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.model.PendingOperation;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.PendingOperationRepository;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.service.ShipmentTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ShipmentWorkflowOrchestrator {

    private final WorkflowValidator validator;
    private final PendingOperationRepository pendingOperationRepository;
    private final EquipmentOrderRepository orderRepository;
    private final ShipmentTrackingRepository shipmentTrackingRepository;

    public void validateStateTransition(ShipmentStatus currentStatus, ShipmentStatus newStatus) {
        validator.validateStatusTransition(currentStatus, newStatus);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registerPendingOperation(Long targetId, String operationType, String payload, String errorMessage) {
        PendingOperation operation = pendingOperationRepository.findByTargetIdAndOperationTypeAndStatus(
                targetId, operationType, "PENDING").orElseGet(
                        () -> PendingOperation.builder()
                                .targetId(targetId)
                                .operationType(operationType)
                                .status("PENDING")
                                .nextRetryAt(LocalDateTime.now().plusMinutes(1))
                                .build());

        operation.setPayload(payload);
        operation.setLastErrorMessage(errorMessage);
        operation.setUpdatedAt(LocalDateTime.now());

        pendingOperationRepository.save(operation);
        log.info("Registered pending operation: {} for targetId: {}", operationType, targetId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markOperationSuccessful(Long targetId, String operationType) {
        pendingOperationRepository.findByTargetIdAndOperationTypeAndStatus(targetId, operationType, "PENDING")
                .ifPresent(op -> {
                    op.setStatus("RECOVERED");
                    op.setUpdatedAt(LocalDateTime.now());
                    pendingOperationRepository.save(op);
                    log.info("Marked operation {} as recovered for targetId: {}", operationType, targetId);
                });
    }

    @Transactional
    public void syncOrderAndShipmentRecord(EquipmentOrder order, ShipmentTracking shipment) {
        if (order != null) {
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }
        if (shipment != null) {
            shipment.setUpdatedAt(LocalDateTime.now());
            shipmentTrackingRepository.save(shipment);
        }
    }
}
