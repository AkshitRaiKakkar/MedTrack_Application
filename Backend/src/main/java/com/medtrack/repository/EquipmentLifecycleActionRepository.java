package com.medtrack.repository;

import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentLifecycleActionRepository extends JpaRepository<EquipmentLifecycleAction, Long> {
    List<EquipmentLifecycleAction> findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(Long equipmentId, Long hospitalId);
    List<EquipmentLifecycleAction> findByHospitalIdAndStatusOrderByRequestedAtDesc(Long hospitalId, EquipmentLifecycleStatus status);
    Optional<EquipmentLifecycleAction> findByIdAndHospitalId(Long id, Long hospitalId);
}
