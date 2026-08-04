package com.medtrack.auth.reporting.repository;

import com.medtrack.auth.reporting.model.ComplianceReportExportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplianceReportExportLogRepository extends JpaRepository<ComplianceReportExportLog, Long> {
    Optional<ComplianceReportExportLog> findByReportId(String reportId);
    List<ComplianceReportExportLog> findByFramework(String framework);
    List<ComplianceReportExportLog> findByGenerationStatus(String generationStatus);
}
