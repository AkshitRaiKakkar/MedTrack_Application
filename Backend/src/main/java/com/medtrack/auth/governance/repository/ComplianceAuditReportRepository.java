package com.medtrack.auth.governance.repository;

import com.medtrack.auth.governance.model.ComplianceAuditReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Audit reports produced by the GRC governance subsystem.
 *
 * <p>The explicit bean name is required, not cosmetic. {@code com.medtrack.auth.compliance.repository}
 * declares a different interface with the same simple name over a different entity, and Spring
 * derives a repository bean name from the simple name alone. Left to the default, whichever
 * definition is scanned second collides with the first and the application context refuses to
 * refresh:</p>
 *
 * <pre>
 * BeanDefinitionOverrideException: Invalid bean definition with name
 * 'complianceAuditReportRepository' defined in
 * com.medtrack.auth.governance.repository.ComplianceAuditReportRepository ... since there is
 * already [...] defined in
 * com.medtrack.auth.compliance.repository.ComplianceAuditReportRepository bound.
 * </pre>
 *
 * <p>That failure takes down every {@code @SpringBootTest} in the project and the application
 * itself. See {@code BeanNameUniquenessTest}.</p>
 */
@Repository("governanceComplianceAuditReportRepository")
public interface ComplianceAuditReportRepository extends JpaRepository<ComplianceAuditReport, Long> {
    List<ComplianceAuditReport> findByOverallStatus(String overallStatus);
}
