package com.medtrack.supplier.repository;

import com.medtrack.supplier.model.SupplierAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SupplierAuditLogRepository extends JpaRepository<SupplierAuditLog, Long> {
    List<SupplierAuditLog> findByOrderIdOrderByTimestampDesc(Long orderId);

    List<SupplierAuditLog> findBySupplierIdOrderByTimestampDesc(Long supplierId);

    List<SupplierAuditLog> findByActionAndTimestampAfter(String action, LocalDateTime timestamp);
}
