package com.medtrack.supplier.recovery;

import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.config.WorkflowConfig;
import com.medtrack.supplier.dto.RecoveryResultDTO;
import com.medtrack.supplier.model.PendingOperation;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.PendingOperationRepository;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.workflow.ShipmentWorkflowOrchestrator;
import com.medtrack.supplier.service.SupplierPerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecoveryEngine {

    private final PendingOperationRepository pendingOperationRepository;
    private final ShipmentWorkflowOrchestrator orchestrator;
    private final WorkflowConfig workflowConfig;
    private final EquipmentOrderRepository orderRepository;
    private final ShipmentTrackingRepository shipmentTrackingRepository;
    private final SupplierPerformanceService supplierPerformanceService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public List<RecoveryResultDTO> processPendingOperations() {
        if (!workflowConfig.isRecoveryEnabled()) {
            log.info("Recovery is disabled by configuration");
            return List.of();
        }

        List<PendingOperation> eligibleOperations = pendingOperationRepository.findEligibleForRecovery(
                LocalDateTime.now(), workflowConfig.getMaxRetries());

        List<RecoveryResultDTO> results = new ArrayList<>();

        for (PendingOperation op : eligibleOperations) {
            RecoveryResultDTO result = recoverOperation(op);
            results.add(result);
        }

        return results;
    }

    private RecoveryResultDTO recoverOperation(PendingOperation op) {
        log.info("Attempting to recover operation type: {} for target: {}", op.getOperationType(), op.getTargetId());

        boolean success = false;
        String message = "";

        try {
            switch (op.getOperationType()) {
                case "EVENT_PUBLISH":
                    success = recoverEventPublish(op);
                    break;
                case "STATUS_SYNC":
                    success = recoverStatusSync(op);
                    break;
                default:
                    message = "Unknown operation type: " + op.getOperationType();
                    break;
            }
        } catch (Exception e) {
            log.error("Recovery failed for operation {}", op.getId(), e);
            message = e.getMessage();
        }

        if (success) {
            op.setStatus("RECOVERED");
            message = "Recovered successfully.";
        } else {
            op.setRetryCount(op.getRetryCount() + 1);
            if (op.getRetryCount() >= workflowConfig.getMaxRetries()) {
                op.setStatus("FAILED");
            } else {
                op.setNextRetryAt(
                        LocalDateTime.now().plusMillis(workflowConfig.getRetryBackoffMillis() * op.getRetryCount()));
            }
            op.setLastErrorMessage(message);
        }

        op.setUpdatedAt(LocalDateTime.now());
        pendingOperationRepository.save(op);

        return RecoveryResultDTO.builder()
                .operationId(op.getId())
                .operationType(op.getOperationType())
                .successful(success)
                .message(message)
                .retryCountAfterRecovery(op.getRetryCount())
                .build();
    }

    private boolean recoverEventPublish(PendingOperation op) {
        if (kafkaTemplate == null) {
            throw new IllegalStateException("KafkaTemplate is not available");
        }

        EquipmentOrder order = orderRepository.findById(op.getTargetId()).orElse(null);
        if (order == null)
            return false;

        ShipmentTracking shipment = shipmentTrackingRepository.findByOrderId(order.getId()).orElse(null);
        if (shipment == null)
            return false;

        ShipmentStatus status = ShipmentStatus.valueOf(order.getStatus());

        try {
            if (status == ShipmentStatus.SHIPPED) {
                com.medtrack.supplier.event.OrderShippedEvent event = com.medtrack.supplier.event.OrderShippedEvent
                        .builder()
                        .orderId(order.getId())
                        .shipmentTrackingNumber(shipment.getShipmentTrackingNumber())
                        .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
                        .shippedAt(order.getDispatchedAt())
                        .supplierId(shipment.getSupplierId())
                        .hospital(order.getHospital())
                        .equipmentName(order.getEquipmentName())
                        .quantity(order.getQuantity())
                        .build();
                kafkaTemplate.send("order-events", String.valueOf(order.getId()), event);
                return true;
            } else if (status == ShipmentStatus.DELIVERED) {
                com.medtrack.supplier.event.OrderDeliveredEvent event = com.medtrack.supplier.event.OrderDeliveredEvent
                        .builder()
                        .orderId(order.getId())
                        .shipmentTrackingNumber(shipment.getShipmentTrackingNumber())
                        .actualDeliveryDate(shipment.getActualDeliveryDate())
                        .supplierId(shipment.getSupplierId())
                        .hospital(order.getHospital())
                        .equipmentName(order.getEquipmentName())
                        .quantity(order.getQuantity())
                        .build();
                kafkaTemplate.send("order-events", String.valueOf(order.getId()), event);
                supplierPerformanceService.publishPerformanceUpdate(shipment.getSupplierId());
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to publish event during recovery", e);
            throw new RuntimeException("Kafka publish failed", e);
        }
        return false;
    }

    private boolean recoverStatusSync(PendingOperation op) {
        EquipmentOrder order = orderRepository.findById(op.getTargetId()).orElse(null);
        ShipmentTracking shipment = shipmentTrackingRepository.findByOrderId(op.getTargetId()).orElse(null);

        if (order != null && shipment != null) {
            orchestrator.syncOrderAndShipmentRecord(order, shipment);
            return true;
        }
        return false;
    }
}
