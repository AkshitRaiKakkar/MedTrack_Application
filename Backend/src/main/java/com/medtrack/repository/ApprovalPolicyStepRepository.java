package com.medtrack.repository;

import com.medtrack.model.ApprovalPolicyStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalPolicyStepRepository extends JpaRepository<ApprovalPolicyStep, Long> {

    List<ApprovalPolicyStep> findByPolicyIdAndActiveTrueOrderByStepGroupAsc(Long policyId);

    List<ApprovalPolicyStep> findByPolicyId(Long policyId);
}
