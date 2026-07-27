package com.medtrack.auth.reporting.repository;

import com.medtrack.auth.reporting.model.ComplianceReportConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceReportConfigRepository extends JpaRepository<ComplianceReportConfig, Long> {
    Optional<ComplianceReportConfig> findByConfigName(String configName);
}
