package com.medtrack.repository;

import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentDisposalRepository extends JpaRepository<EquipmentDisposal, Long> {
    List<EquipmentDisposal> findByHospitalIdOrderByRequestedAtDesc(Long hospitalId);
    List<EquipmentDisposal> findByHospitalIdAndStatusOrderByRequestedAtDesc(Long hospitalId, EquipmentDisposalStatus status);
    List<EquipmentDisposal> findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(Long equipmentId, Long hospitalId);
    Optional<EquipmentDisposal> findByIdAndHospitalId(Long id, Long hospitalId);
}
