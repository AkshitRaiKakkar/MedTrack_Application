package com.medtrack.repository;

import com.medtrack.model.ApprovalPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalPolicyRepository extends JpaRepository<ApprovalPolicy, Long> {

    List<ApprovalPolicy> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);

    List<ApprovalPolicy> findByHospitalIdAndActiveTrue(Long hospitalId);

    Optional<ApprovalPolicy> findByIdAndHospitalId(Long id, Long hospitalId);
}
