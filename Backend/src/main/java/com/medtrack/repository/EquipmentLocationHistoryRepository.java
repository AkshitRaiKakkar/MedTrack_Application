package com.medtrack.repository;

import com.medtrack.model.EquipmentLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentLocationHistoryRepository extends JpaRepository<EquipmentLocationHistory, Long> {

    List<EquipmentLocationHistory> findByEquipmentIdOrderByCreatedAtDesc(Long equipmentId);

    long countByLocationId(Long locationId);
}