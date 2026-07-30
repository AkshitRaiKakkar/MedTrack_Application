package com.medtrack.repository;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long>,
        JpaSpecificationExecutor<Equipment> {

    Optional<Equipment> findByEquipmentCode(String equipmentCode);
    Optional<Equipment> findBySerialNumber(String serialNumber);

    // Tenant-specific queries
    List<Equipment> findByHospitalId(Long hospitalId);

    Optional<Equipment> findByIdAndHospitalId(Long id, Long hospitalId);

    // Warranty monitoring queries
    List<Equipment> findByHospitalIdAndWarrantyExpiryBefore(
            Long hospitalId,
            LocalDate date
    );

    List<Equipment> findByHospitalIdAndWarrantyExpiryBetween(
            Long hospitalId,
            LocalDate startDate,
            LocalDate endDate
    );

    // Low stock inventory
    @Query("""
            SELECT e
            FROM Equipment e
            WHERE e.hospital.id = :hospitalId
            AND e.quantity <= e.minimumStock
            """)
    List<Equipment> findLowStockEquipment(@Param("hospitalId") Long hospitalId);

    // Analytics aggregation queries
    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.hospital.id = :hospitalId")
    long countByHospitalId(@Param("hospitalId") Long hospitalId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.hospital.id = :hospitalId AND e.status = :status")
    long countByHospitalIdAndStatus(@Param("hospitalId") Long hospitalId, @Param("status") EquipmentStatus status);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.hospital.id = :hospitalId AND e.warrantyExpiry BETWEEN :start AND :end")
    long countByHospitalIdAndWarrantyExpiryBetween(@Param("hospitalId") Long hospitalId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT e.name, e.category FROM Equipment e WHERE e.hospital.id = :hospitalId")
    List<Object[]> findNameAndCategoryByHospitalId(@Param("hospitalId") Long hospitalId);

    @Query("""
    SELECT e.category, COUNT(e)
    FROM Equipment e
    WHERE e.hospital.id = :hospitalId
    GROUP BY e.category
""")
    List<Object[]> countEquipmentByCategory(@Param("hospitalId") Long hospitalId);

    List<Equipment> findByHospitalIdAndDepartmentIgnoreCase(Long hospitalId, String department);

    Page<Equipment> findByHospitalId(Long hospitalId, Pageable pageable);

    // countByHospitalId and countByHospitalIdAndStatus are declared above as @Query methods.
    // They were also declared here as derived queries, which is a duplicate method signature
    // and is rejected by javac, so only the @Query declarations are kept.
    long countByHospitalIdAndWarrantyExpiryBefore(Long hospitalId, LocalDate date);
}