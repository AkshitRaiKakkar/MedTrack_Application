package com.medtrack.repository;

import com.medtrack.model.EquipmentOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentOrderRepository extends JpaRepository<EquipmentOrder, Long> {
        Optional<EquipmentOrder> findByOrderCode(String orderCode);

        List<EquipmentOrder> findByStatus(String status);

        List<EquipmentOrder> findByEquipmentId(String equipmentId);

        List<EquipmentOrder> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

        @Query("SELECT o FROM EquipmentOrder o WHERE " +
                        "(:status IS NULL OR o.status = :status) AND " +
                        "(:shippingStatus IS NULL OR o.shippingStatus = :shippingStatus) AND " +
                        "(cast(:startDate as java.time.LocalDateTime) IS NULL OR o.orderDate >= :startDate) AND " +
                        "(cast(:endDate as java.time.LocalDateTime) IS NULL OR o.orderDate <= :endDate) AND " +
                        "(:trackingNumber IS NULL OR LOWER(o.trackingNo) LIKE LOWER(CONCAT('%', :trackingNumber, '%'))) AND "
                        +
                        "(:hasShipmentParams = false OR EXISTS (SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id "
                        +
                        "AND (:supplierId IS NULL OR s.supplierId = :supplierId) " +
                        "AND (:deliveryStatus IS NULL OR s.shipmentStatus = :deliveryStatus) " +
                        "AND (:isDelayed IS NULL OR s.delayDetected = :isDelayed) " +
                        ")) AND " +
                        "(:search IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')))")
        Page<EquipmentOrder> findAdvancedSupplierOrders(
                        @Param("status") String status,
                        @Param("shippingStatus") String shippingStatus,
                        @Param("deliveryStatus") com.medtrack.supplier.model.ShipmentStatus deliveryStatus,
                        @Param("isDelayed") Boolean isDelayed,
                        @Param("trackingNumber") String trackingNumber,
                        @Param("startDate") java.time.LocalDateTime startDate,
                        @Param("endDate") java.time.LocalDateTime endDate,
                        @Param("supplierId") Long supplierId,
                        @Param("search") String search,
                        @Param("hasShipmentParams") boolean hasShipmentParams,
                        Pageable pageable);

        // Phase 11: Dashboard API methods
        @Query("SELECT COUNT(o) FROM EquipmentOrder o WHERE EXISTS (SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id AND s.supplierId = :supplierId)")
        long countTotalOrdersBySupplierId(@Param("supplierId") Long supplierId);

        @Query("SELECT COUNT(o) FROM EquipmentOrder o WHERE o.status = :status AND EXISTS (SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id AND s.supplierId = :supplierId)")
        long countOrdersByStatusAndSupplierId(@Param("status") String status, @Param("supplierId") Long supplierId);
}
