package com.medtrack.repository;

import com.medtrack.model.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findByEquipmentCode(String equipmentCode);

    // Tenant-specific queries
    List<Equipment> findByHospitalId(Long hospitalId);
    Optional<Equipment> findByIdAndHospitalId(Long id, Long hospitalId);

    // Warranty monitoring queries
    List<Equipment> findByHospitalIdAndWarrantyExpiryBefore(Long hospitalId, LocalDate date);

    List<Equipment> findByHospitalIdAndWarrantyExpiryBetween(
            Long hospitalId,
            LocalDate startDate,
            LocalDate endDate
    );
    @Query("""
    SELECT e
    FROM Equipment e
    WHERE e.hospital.id = :hospitalId
    AND (
        LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(e.equipmentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(e.department) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(CAST(e.category AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    """)
    List<Equipment> searchEquipment(@Param("hospitalId") Long hospitalId,
                                    @Param("keyword") String keyword);

}
}