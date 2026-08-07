package com.medtrack.repository;

import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:supplier-order-query-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
class SupplierOrderQueryRepositoryTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentOrderRepository orderRepository;

    // This repository currently contains an unrelated, invalid DATEDIFF query. Mocking it keeps
    // this regression test focused on EquipmentOrderRepository while EntityManager persists the
    // shipment rows consumed by its subqueries.
    @MockitoBean
    private ShipmentTrackingRepository shipmentRepository;

    @Autowired
    private EntityManager entityManager;

    private EquipmentOrder supplierOrder;
    private EquipmentOrder otherSupplierOrder;

    @BeforeEach
    void setUp() {
        supplierOrder = saveOrder("ORD-SUP-1", "Infusion Pump", "SHIPPED",
                LocalDateTime.of(2026, 8, 2, 10, 0));
        otherSupplierOrder = saveOrder("ORD-SUP-2", "Infusion Pump", "SHIPPED",
                LocalDateTime.of(2026, 8, 2, 11, 0));
        EquipmentOrder pendingOrder = saveOrder("ORD-SUP-3", "Ventilator", "PENDING",
                LocalDateTime.of(2026, 7, 20, 9, 0));

        saveShipment(supplierOrder, 41L, "TRACK-MATCH-41", ShipmentStatus.SHIPPED, true);
        saveShipment(otherSupplierOrder, 99L, "TRACK-MATCH-99", ShipmentStatus.SHIPPED, true);
        saveShipment(pendingOrder, 41L, "TRACK-PENDING-41", ShipmentStatus.PENDING, false);
    }

    @Test
    void advancedSearchCombinesShipmentFiltersWithoutLeakingOtherSuppliersOrders() {
        Page<EquipmentOrder> result = orderRepository.findAdvancedSupplierOrders(
                "SHIPPED", "Shipped", ShipmentStatus.SHIPPED, true, "match",
                LocalDateTime.of(2026, 8, 1, 0, 0),
                LocalDateTime.of(2026, 8, 3, 0, 0),
                41L, "pump", true, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals(supplierOrder.getId(), result.getContent().get(0).getId());
    }

    @Test
    void unfilteredHospitalSearchIncludesOrdersWithoutShipmentRestrictions() {
        Page<EquipmentOrder> result = orderRepository.findAdvancedSupplierOrders(
                null, null, null, null, null, null, null,
                null, null, false, PageRequest.of(0, 10));

        assertEquals(3, result.getTotalElements());
    }

    @Test
    void dashboardCountsAreScopedToSupplierAndStatus() {
        assertEquals(2, orderRepository.countTotalOrdersBySupplierId(41L));
        assertEquals(1, orderRepository.countOrdersByStatusAndSupplierId("SHIPPED", 41L));
        assertEquals(1, orderRepository.countOrdersByStatusAndSupplierId("SHIPPED", 99L));
        assertEquals(0, orderRepository.countOrdersByStatusAndSupplierId("DELIVERED", 41L));
    }

    private EquipmentOrder saveOrder(String code, String equipmentName, String status, LocalDateTime orderDate) {
        return orderRepository.save(EquipmentOrder.builder()
                .orderCode(code)
                .equipmentId("EQ-" + code)
                .equipmentName(equipmentName)
                .quantity(2)
                .status(status)
                .shippingStatus(status.equals("SHIPPED") ? "Shipped" : "Processing")
                .hospital("Repository Test Hospital")
                .createdBy("repository-test@medtrack.test")
                .orderDate(orderDate)
                .trackingNo("ORDER-" + code)
                .build());
    }

    private void saveShipment(EquipmentOrder order, Long supplierId, String trackingNumber,
            ShipmentStatus status, boolean delayed) {
        entityManager.persist(ShipmentTracking.builder()
                .orderId(order.getId())
                .supplierId(supplierId)
                .shipmentTrackingNumber(trackingNumber)
                .shipmentStatus(status)
                .delayDetected(delayed)
                .build());
        entityManager.flush();
    }
}
