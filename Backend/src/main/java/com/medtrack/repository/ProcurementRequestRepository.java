package com.medtrack.repository;

import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcurementRequestRepository extends JpaRepository<ProcurementRequest, Long> {

    Optional<ProcurementRequest> findByIdAndHospitalId(Long id, Long hospitalId);

    Optional<ProcurementRequest> findByRequestCode(String requestCode);

    List<ProcurementRequest> findByHospitalIdOrderByRequestedAtDesc(Long hospitalId);

    List<ProcurementRequest> findByHospitalIdAndStatusOrderByRequestedAtDesc(
            Long hospitalId, ProcurementRequestStatus status);

    List<ProcurementRequest> findByHospitalIdAndStatusInOrderByRequestedAtDesc(
            Long hospitalId, List<ProcurementRequestStatus> statuses);
}
