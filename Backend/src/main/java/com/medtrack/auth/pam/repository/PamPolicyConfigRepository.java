package com.medtrack.auth.pam.repository;

import com.medtrack.auth.pam.model.PamPolicyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PamPolicyConfigRepository extends JpaRepository<PamPolicyConfig, Long> {
    Optional<PamPolicyConfig> findByPolicyName(String policyName);
}
