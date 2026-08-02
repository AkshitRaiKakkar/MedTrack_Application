package com.medtrack.repository;

import com.medtrack.model.ProcurementAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcurementAuditLogRepository extends JpaRepository<ProcurementAuditLog, Long> {

    List<ProcurementAuditLog> findByRequestIdOrderByCreatedAtDesc(Long requestId);

    List<ProcurementAuditLog> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
}
