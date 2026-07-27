package com.medtrack.auth.commandcenter.repository;

import com.medtrack.auth.commandcenter.model.SecurityUnifiedAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityUnifiedAlertRepository extends JpaRepository<SecurityUnifiedAlert, Long> {
    Optional<SecurityUnifiedAlert> findByAlertId(String alertId);
    List<SecurityUnifiedAlert> findByResolutionStatus(String resolutionStatus);
    List<SecurityUnifiedAlert> findBySeverity(String severity);
}
