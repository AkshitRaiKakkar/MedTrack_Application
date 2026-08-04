package com.medtrack.repository;

import com.medtrack.model.EquipmentOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentOrderRepository extends JpaRepository<EquipmentOrder, Long> {
    Optional<EquipmentOrder> findByOrderCode(String orderCode);

    List<EquipmentOrder> findByHospital(String hospital);

    Page<EquipmentOrder> findByHospital(String hospital, Pageable pageable);

    List<EquipmentOrder> findByStatus(String status);

    List<EquipmentOrder> findByEquipmentId(String equipmentId);

    List<EquipmentOrder> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o FROM EquipmentOrder o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:shippingStatus IS NULL OR o.shippingStatus = :shippingStatus) AND " +
            "(:supplierId IS NULL OR EXISTS (SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id AND s.supplierId = :supplierId)) AND "
            +
            "(:search IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<EquipmentOrder> findSupplierOrders(
            @Param("status") String status,
            @Param("shippingStatus") String shippingStatus,
            @Param("supplierId") Long supplierId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT o FROM EquipmentOrder o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:shippingStatus IS NULL OR o.shippingStatus = :shippingStatus) AND " +
            "(CAST(:startDate AS LocalDateTime) IS NULL OR o.orderDate >= :startDate) AND " +
            "(CAST(:endDate AS LocalDateTime) IS NULL OR o.orderDate <= :endDate) AND " +
            "(:trackingNumber IS NULL OR LOWER(o.trackingNo) LIKE LOWER(CONCAT('%', :trackingNumber, '%'))) AND " +
            "(:hasShipmentParams = false OR EXISTS (" +
            "SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id " +
            "AND (:supplierId IS NULL OR s.supplierId = :supplierId) " +
            "AND (:deliveryStatus IS NULL OR s.shipmentStatus = :deliveryStatus) " +
            "AND (:isDelayed IS NULL OR s.delayDetected = :isDelayed))) AND " +
            "(:search IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<EquipmentOrder> findAdvancedSupplierOrders(
            @Param("status") String status,
            @Param("shippingStatus") String shippingStatus,
            @Param("deliveryStatus") com.medtrack.supplier.model.ShipmentStatus deliveryStatus,
            @Param("isDelayed") Boolean isDelayed,
            @Param("trackingNumber") String trackingNumber,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("supplierId") Long supplierId,
            @Param("search") String search,
            @Param("hasShipmentParams") boolean hasShipmentParams,
            Pageable pageable);

    @Query("SELECT COUNT(o) FROM EquipmentOrder o WHERE EXISTS (" +
            "SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id AND s.supplierId = :supplierId)")
    long countTotalOrdersBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COUNT(o) FROM EquipmentOrder o WHERE o.status = :status AND EXISTS (" +
            "SELECT s FROM ShipmentTracking s WHERE s.orderId = o.id AND s.supplierId = :supplierId)")
    long countOrdersByStatusAndSupplierId(
            @Param("status") String status,
            @Param("supplierId") Long supplierId);

    // Analytics aggregation queries
    @Query("SELECT SUM(o.totalCost) FROM EquipmentOrder o WHERE LOWER(o.hospital) = LOWER(:hospitalName) AND LOWER(o.shippingStatus) = LOWER(:shippingStatus)")
    BigDecimal sumTotalCostByHospitalAndShippingStatus(@Param("hospitalName") String hospitalName, @Param("shippingStatus") String shippingStatus);

    @Query("SELECT o FROM EquipmentOrder o WHERE LOWER(o.hospital) = LOWER(:hospitalName) AND LOWER(o.shippingStatus) = LOWER(:shippingStatus)")
    List<EquipmentOrder> findByHospitalAndShippingStatus(@Param("hospitalName") String hospitalName, @Param("shippingStatus") String shippingStatus);

    // Soft delete - archived records (deleted = true).
    //
    // Native for the same reason as the equipment archive queries: EquipmentOrder carries a
    // class-level @SQLRestriction("deleted = false"), which Hibernate appends to every HQL and
    // criteria query for the entity. As derived queries these asked for `deleted = true AND
    // deleted = false` and could never return a row, so an archived order could not be listed,
    // restored or purged.

    @Query(value = "SELECT * FROM equipment_orders WHERE deleted = TRUE", nativeQuery = true)
    List<EquipmentOrder> findByDeletedTrue();

    @Query(value = "SELECT * FROM equipment_orders WHERE deleted = TRUE",
            countQuery = "SELECT COUNT(*) FROM equipment_orders WHERE deleted = TRUE",
            nativeQuery = true)
    Page<EquipmentOrder> findByDeletedTrue(Pageable pageable);

    @Query(value = "SELECT * FROM equipment_orders WHERE deleted = TRUE AND hospital = :hospital",
            countQuery = "SELECT COUNT(*) FROM equipment_orders WHERE deleted = TRUE AND hospital = :hospital",
            nativeQuery = true)
    Page<EquipmentOrder> findByHospitalAndDeletedTrue(
            @Param("hospital") String hospital,
            Pageable pageable);

    @Query(value = "SELECT * FROM equipment_orders WHERE id = :id AND deleted = TRUE", nativeQuery = true)
    Optional<EquipmentOrder> findByIdAndDeletedTrue(@Param("id") Long id);
}
