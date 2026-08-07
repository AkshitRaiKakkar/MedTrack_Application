package com.medtrack.supplier.service;

import com.medtrack.supplier.model.SupplierAuditLog;
import com.medtrack.supplier.repository.SupplierAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierAuditLogService {

    private final SupplierAuditLogRepository auditLogRepository;

    /**
     * Logs an audit action asynchronously or in a new transaction so it won't
     * rollback
     * on primary transaction failure (optional depending on system needs, here
     * using REQUIRES_NEW
     * to ensure logs are written even if the business logic throws an exception
     * post-log,
     * but usually logging happens at the end. Setting to standard REQUIRED for now,
     * with an option to separate if needed).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long orderId, Long supplierId, String action, String details, String performedBy) {
        try {
            SupplierAuditLog auditLog = SupplierAuditLog.builder()
                    .orderId(orderId)
                    .supplierId(supplierId)
                    .action(action)
                    .details(details)
                    .performedBy(performedBy)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Audit Log Entry Created: [{}] Supplier: {}, Order: {}, By: {}", action, supplierId, orderId,
                    performedBy);
        } catch (Exception e) {
            log.error("Failed to write audit log for action: {}", action, e);
        }
    }
}
