package com.medtrack.repository;

import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenancePolicyRuleRepository extends JpaRepository<MaintenancePolicyRule, Long> {

    List<MaintenancePolicyRule> findByHospitalId(Long hospitalId);

    Optional<MaintenancePolicyRule> findByIdAndHospitalId(Long id, Long hospitalId);

    List<MaintenancePolicyRule> findByHospitalIdAndActiveTrue(Long hospitalId);

    List<MaintenancePolicyRule> findByHospitalIdAndRuleScope(Long hospitalId, MaintenanceRuleScope ruleScope);
}
