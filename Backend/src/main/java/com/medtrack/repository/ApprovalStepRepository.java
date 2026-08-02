package com.medtrack.repository;

import com.medtrack.model.ApprovalStep;
import com.medtrack.model.ApprovalStepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {

    List<ApprovalStep> findByRequestIdOrderByStepGroupAscIdAsc(Long requestId);

    List<ApprovalStep> findByRequestIdAndStatusOrderByStepGroupAsc(
            Long requestId, ApprovalStepStatus status);

    List<ApprovalStep> findByHospitalIdAndStatusOrderByCreatedAtAsc(
            Long hospitalId, ApprovalStepStatus status);

    Optional<ApprovalStep> findByIdAndHospitalId(Long id, Long hospitalId);
}
