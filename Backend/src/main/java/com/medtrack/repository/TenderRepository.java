package com.medtrack.repository;

import com.medtrack.model.Tender;
import com.medtrack.model.TenderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderRepository extends JpaRepository<Tender, Long> {

    List<Tender> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);

    List<Tender> findByHospitalIdAndStatusOrderByCreatedAtDesc(Long hospitalId, TenderStatus status);

    List<Tender> findByStatusOrderByCreatedAtDesc(TenderStatus status);

    Optional<Tender> findByIdAndHospitalId(Long id, Long hospitalId);

    Optional<Tender> findByTenderCode(String tenderCode);
}
