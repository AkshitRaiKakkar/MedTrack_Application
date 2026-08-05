package com.medtrack.repository;

import com.medtrack.model.MaintenanceGenerationRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceGenerationRunRepository extends JpaRepository<MaintenanceGenerationRun, Long> {

    List<MaintenanceGenerationRun> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);

    Optional<MaintenanceGenerationRun> findByHospitalIdAndPolicyRuleIdAndWindowStartAndWindowEnd(
            Long hospitalId, Long policyRuleId, LocalDate windowStart, LocalDate windowEnd);
}
