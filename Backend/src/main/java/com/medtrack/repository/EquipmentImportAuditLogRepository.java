package com.medtrack.repository;

import com.medtrack.model.EquipmentImportAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentImportAuditLogRepository extends JpaRepository<EquipmentImportAuditLog, Long> {

    List<EquipmentImportAuditLog> findTop20ByHospitalIdOrderByImportedAtDesc(Long hospitalId);
}
