package com.medtrack.repository;

import com.medtrack.model.EquipmentAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EquipmentAuditRepository
        extends JpaRepository<EquipmentAudit, Long> {

    List<EquipmentAudit> findByHospitalIdOrderByTimestampDesc(Long hospitalId);

    List<EquipmentAudit> findByEquipmentIdOrderByTimestampDesc(Long equipmentId);

    List<EquipmentAudit> findByUsernameOrderByTimestampDesc(String username);

    List<EquipmentAudit> findByActionOrderByTimestampDesc(String action);

    List<EquipmentAudit> findByTimestampBetweenOrderByTimestampDesc(
            LocalDateTime start,
            LocalDateTime end
    );
}