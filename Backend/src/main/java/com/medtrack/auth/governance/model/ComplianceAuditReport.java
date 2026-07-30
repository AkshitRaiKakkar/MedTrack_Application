package com.medtrack.auth.governance.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Historical security compliance audit scans and health scores produced by the GRC governance
 * subsystem.
 *
 * <p>The explicit entity and table names are required, not cosmetic.
 * {@code com.medtrack.auth.compliance.model} declares a different entity with the same simple name,
 * and Hibernate derives an entity name from the simple name alone:</p>
 *
 * <pre>
 * DuplicateMappingException: Entity classes [com.medtrack.auth.compliance.model.ComplianceAuditReport]
 * and [com.medtrack.auth.governance.model.ComplianceAuditReport] share the entity name
 * 'ComplianceAuditReport' (entity names must be distinct)
 * </pre>
 *
 * <p>Both also declared {@code @Table(name = "compliance_audit_reports")} while carrying completely
 * different columns - this one records {@code scanTitle}/{@code complianceScore}/
 * {@code overallStatus}/{@code scannedAt}, the other records {@code reportId}/
 * {@code frameworkStandard}/{@code status}/{@code auditDate}. Under
 * {@code hbm2ddl.auto=update} that produces one table holding the union of two unrelated schemas,
 * with every column of the absent entity left null on each write. They are separate concepts and
 * now use separate tables.</p>
 */
@Entity(name = "GovernanceComplianceAuditReport")
@Table(name = "governance_compliance_audit_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceAuditReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String scanTitle;

    @Column(nullable = false)
    private int complianceScore; // 0 to 100

    @Column(nullable = false)
    private int totalControlsEvaluated;

    @Column(nullable = false)
    private int passedControlsCount;

    @Column(nullable = false)
    private int failedControlsCount;

    @Column(nullable = false)
    private String overallStatus; // COMPLIANT, WARNING, NON_COMPLIANT

    @Column(length = 2000)
    private String summaryDetails;

    @Column(nullable = false)
    private LocalDateTime scannedAt;
}
