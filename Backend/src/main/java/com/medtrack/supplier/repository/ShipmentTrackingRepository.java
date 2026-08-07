package com.medtrack.supplier.repository;

import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentTrackingRepository extends JpaRepository<ShipmentTracking, Long> {
    List<ShipmentTracking> findByShipmentStatus(ShipmentStatus status);

    Optional<ShipmentTracking> findByShipmentTrackingNumber(String shipmentTrackingNumber);

    Optional<ShipmentTracking> findByOrderId(Long orderId);

    List<ShipmentTracking> findBySupplierId(Long supplierId);

    List<ShipmentTracking> findByEstimatedDeliveryDateBefore(LocalDateTime dateTime);

    // Phase 7: Delay detection - find active (non-delivered) shipments not yet
    // flagged as delayed
    List<ShipmentTracking> findByShipmentStatusNotAndDelayDetectedFalse(ShipmentStatus status);

    // Phase 7: Performance scoring - delivered shipments by supplier
    List<ShipmentTracking> findBySupplierIdAndShipmentStatus(Long supplierId, ShipmentStatus status);

    // Phase 7: Performance scoring - counts
    long countBySupplierId(Long supplierId);

    long countBySupplierIdAndDelayDetectedTrue(Long supplierId);

    List<ShipmentTracking> findBySupplierIdAndDelayDetectedTrue(Long supplierId);

    // Phase 11: Dashboard API methods
    @Query("SELECT COUNT(s) FROM ShipmentTracking s WHERE s.supplierId = :supplierId")
    long countTotalShipmentsBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COUNT(s) FROM ShipmentTracking s WHERE s.supplierId = :supplierId AND s.shipmentStatus = 'DELIVERED'")
    long countDeliveredShipmentsBySupplierId(@Param("supplierId") Long supplierId);

    @Query(value = "SELECT COALESCE(AVG(DATEDIFF(DAY, created_at, actual_delivery_date)), 0.0) FROM shipment_tracking WHERE supplier_id = :supplierId AND shipment_status = 'DELIVERED'", nativeQuery = true)
    Double getAverageDeliveryTimeDays(@Param("supplierId") Long supplierId);

    @Query("SELECT DISTINCT s.supplierId FROM ShipmentTracking s")
    List<Long> findDistinctSupplierIds();
}
