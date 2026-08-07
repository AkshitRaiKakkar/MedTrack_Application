package com.medtrack.repository;

import com.medtrack.model.SparePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    List<SparePart> findByHospitalId(Long hospitalId);

    Optional<SparePart> findByIdAndHospitalId(Long id, Long hospitalId);

    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND s.stockLevel <= s.reorderPoint")
    List<SparePart> findLowStockPartsByHospitalId(@Param("hospitalId") Long hospitalId);
}
