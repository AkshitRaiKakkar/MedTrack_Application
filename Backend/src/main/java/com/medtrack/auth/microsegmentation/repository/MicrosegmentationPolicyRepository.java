package com.medtrack.auth.microsegmentation.repository;

import com.medtrack.auth.microsegmentation.model.MicrosegmentationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MicrosegmentationPolicyRepository extends JpaRepository<MicrosegmentationPolicy, Long> {
    Optional<MicrosegmentationPolicy> findByRuleId(String ruleId);
    List<MicrosegmentationPolicy> findByStatus(String status);
}
