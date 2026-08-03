package com.medtrack.repository;

import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenancePolicyRuleRepository extends JpaRepository<MaintenancePolicyRule, Long> {

    List<MaintenancePolicyRule> findByHospitalId(Long hospitalId);

    Optional<MaintenancePolicyRule> findByIdAndHospitalId(Long id, Long hospitalId);

    /**
     * Serializes manual and scheduled generation for one hospital-owned rule.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rule FROM MaintenancePolicyRule rule "
            + "WHERE rule.id = :id AND rule.hospitalId = :hospitalId")
    Optional<MaintenancePolicyRule> findByIdAndHospitalIdForUpdate(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    List<MaintenancePolicyRule> findByHospitalIdAndActiveTrue(Long hospitalId);

    List<MaintenancePolicyRule> findByHospitalIdAndRuleScope(Long hospitalId, MaintenanceRuleScope ruleScope);
}
