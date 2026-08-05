package com.medtrack.supplier.repository;

import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@Transactional
class EquipmentOrderSupplierQueryTest {

    private static final Long SUPPLIER_ONE = 101L;
    private static final Long SUPPLIER_TWO = 202L;

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentOrderRepository orderRepository;

    @MockitoBean
    private ShipmentTrackingRepository shipmentRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void advancedFiltersReturnOnlyTheMatchingSuppliersOrder() {
        EquipmentOrder matchingOrder = saveOrder(
                "ORD-ADV-1", "Ventilator Pro", "DELIVERED", "Delivered",
                "TRK-MED-100", LocalDateTime.of(2026, 7, 15, 9, 30));
        saveShipment(matchingOrder, SUPPLIER_ONE, ShipmentStatus.DELIVERED, true, "SHIP-ADV-1");

        EquipmentOrder otherSupplierOrder = saveOrder(
                "ORD-ADV-2", "Ventilator Pro", "DELIVERED", "Delivered",
                "TRK-MED-200", LocalDateTime.of(2026, 7, 16, 9, 30));
        saveShipment(otherSupplierOrder, SUPPLIER_TWO, ShipmentStatus.DELIVERED, true, "SHIP-ADV-2");

        EquipmentOrder wrongStatusOrder = saveOrder(
                "ORD-ADV-3", "Ventilator Pro", "SHIPPED", "Shipped",
                "TRK-MED-300", LocalDateTime.of(2026, 7, 17, 9, 30));
        saveShipment(wrongStatusOrder, SUPPLIER_ONE, ShipmentStatus.SHIPPED, false, "SHIP-ADV-3");

        Page<EquipmentOrder> result = orderRepository.findAdvancedSupplierOrders(
                "DELIVERED",
                "Delivered",
                ShipmentStatus.DELIVERED,
                true,
                "med-1",
                LocalDateTime.of(2026, 7, 1, 0, 0),
                LocalDateTime.of(2026, 7, 31, 23, 59),
                SUPPLIER_ONE,
                "ventilator",
                true,
                PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertEquals(matchingOrder.getId(), result.getContent().get(0).getId());
    }

    @Test
    void supplierFilterExcludesUnassignedAndOtherSupplierOrders() {
        EquipmentOrder assigned = saveOrder(
                "ORD-OWN-1", "Infusion Pump", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 6, 10, 8, 0));
        saveShipment(assigned, SUPPLIER_ONE, ShipmentStatus.PENDING, false, "SHIP-OWN-1");

        EquipmentOrder unassigned = saveOrder(
                "ORD-OWN-2", "Infusion Pump", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 6, 11, 8, 0));

        EquipmentOrder assignedElsewhere = saveOrder(
                "ORD-OWN-3", "Infusion Pump", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 6, 12, 8, 0));
        saveShipment(assignedElsewhere, SUPPLIER_TWO, ShipmentStatus.PENDING, false, "SHIP-OWN-3");

        Page<EquipmentOrder> result = orderRepository.findAdvancedSupplierOrders(
                null, null, null, null, null, null, null,
                SUPPLIER_ONE, null, true, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertEquals(assigned.getId(), result.getContent().get(0).getId());
        assertTrue(result.getContent().stream().noneMatch(order -> order.getId().equals(unassigned.getId())));
    }

    @Test
    void searchAndDateFiltersWorkWithoutAShipmentJoin() {
        EquipmentOrder matchingOrder = saveOrder(
                "ORD-DATE-1", "Cardiac Monitor", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 5, 15, 12, 0));
        saveOrder(
                "ORD-DATE-2", "Cardiac Monitor", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 4, 15, 12, 0));
        saveOrder(
                "ORD-DATE-3", "Surgical Light", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 5, 20, 12, 0));

        Page<EquipmentOrder> result = orderRepository.findAdvancedSupplierOrders(
                null,
                null,
                null,
                null,
                null,
                LocalDateTime.of(2026, 5, 1, 0, 0),
                LocalDateTime.of(2026, 5, 31, 23, 59),
                null,
                "cardiac",
                false,
                PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertEquals(matchingOrder.getId(), result.getContent().get(0).getId());
    }

    @Test
    void dashboardCountsAreScopedBySupplierAndOrderStatus() {
        EquipmentOrder pending = saveOrder(
                "ORD-COUNT-1", "MRI Coil", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 3, 1, 10, 0));
        saveShipment(pending, SUPPLIER_ONE, ShipmentStatus.PENDING, false, "SHIP-COUNT-1");

        EquipmentOrder delivered = saveOrder(
                "ORD-COUNT-2", "MRI Coil", "DELIVERED", "Delivered",
                "TRK-COUNT-2", LocalDateTime.of(2026, 3, 2, 10, 0));
        saveShipment(delivered, SUPPLIER_ONE, ShipmentStatus.DELIVERED, false, "SHIP-COUNT-2");

        EquipmentOrder anotherSupplier = saveOrder(
                "ORD-COUNT-3", "MRI Coil", "PENDING", "Processing",
                null, LocalDateTime.of(2026, 3, 3, 10, 0));
        saveShipment(anotherSupplier, SUPPLIER_TWO, ShipmentStatus.PENDING, false, "SHIP-COUNT-3");

        assertEquals(2L, orderRepository.countTotalOrdersBySupplierId(SUPPLIER_ONE));
        assertEquals(1L, orderRepository.countOrdersByStatusAndSupplierId("PENDING", SUPPLIER_ONE));
        assertEquals(1L, orderRepository.countOrdersByStatusAndSupplierId("DELIVERED", SUPPLIER_ONE));
        assertEquals(1L, orderRepository.countTotalOrdersBySupplierId(SUPPLIER_TWO));
    }

    private EquipmentOrder saveOrder(
            String orderCode,
            String equipmentName,
            String status,
            String shippingStatus,
            String trackingNumber,
            LocalDateTime orderDate) {
        return orderRepository.saveAndFlush(EquipmentOrder.builder()
                .orderCode(orderCode)
                .equipmentId("EQ-" + orderCode)
                .equipmentName(equipmentName)
                .quantity(2)
                .unitCost(new BigDecimal("1250.00"))
                .status(status)
                .shippingStatus(shippingStatus)
                .hospital("Repository Test Hospital")
                .createdBy("hospital@example.com")
                .trackingNo(trackingNumber)
                .orderDate(orderDate)
                .build());
    }

    private void saveShipment(
            EquipmentOrder order,
            Long supplierId,
            ShipmentStatus status,
            boolean delayed,
            String trackingNumber) {
        ShipmentTracking shipment = ShipmentTracking.builder()
                .orderId(order.getId())
                .shipmentTrackingNumber(trackingNumber)
                .shipmentStatus(status)
                .supplierId(supplierId)
                .delayDetected(delayed)
                .estimatedDeliveryDate(order.getOrderDate().plusDays(3))
                .actualDeliveryDate(status == ShipmentStatus.DELIVERED
                        ? order.getOrderDate().plusDays(2)
                        : null)
                .build();
        entityManager.persist(shipment);
        entityManager.flush();
    }
}
