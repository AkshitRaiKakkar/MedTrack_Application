package com.medtrack.repository;

import com.medtrack.model.SparePart;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    List<SparePart> findByHospitalId(Long hospitalId);

    Optional<SparePart> findByIdAndHospitalId(Long id, Long hospitalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SparePart s WHERE s.id = :id AND s.hospitalId = :hospitalId")
    Optional<SparePart> findByIdAndHospitalIdForUpdate(@Param("id") Long id, @Param("hospitalId") Long hospitalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND LOWER(s.partNumber) = LOWER(:partNumber)")
    Optional<SparePart> findByHospitalIdAndPartNumberForUpdate(@Param("hospitalId") Long hospitalId, @Param("partNumber") String partNumber);

    boolean existsByHospitalIdAndPartNumberIgnoreCase(Long hospitalId, String partNumber);

    boolean existsByHospitalIdAndPartNumberIgnoreCaseAndIdNot(Long hospitalId, String partNumber, Long id);

    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND s.stockLevel <= s.reorderPoint")
    List<SparePart> findLowStockPartsByHospitalId(@Param("hospitalId") Long hospitalId);
}
