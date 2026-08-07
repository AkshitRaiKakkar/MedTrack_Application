package com.medtrack.repository;

import com.medtrack.model.TenderAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenderAuditLogRepository extends JpaRepository<TenderAuditLog, Long> {

    List<TenderAuditLog> findByTenderIdOrderByCreatedAtDesc(Long tenderId);

    List<TenderAuditLog> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
}
