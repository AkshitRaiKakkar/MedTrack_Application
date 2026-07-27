package com.medtrack.auth.evidence.commandcenter.model;

package com.medtrack.auth.commandcenter.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking unified security alerts aggregated from all MedTrack security subsystems.
 */
@Entity
@Table(name = "security_unified_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityUnifiedAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String alertId; // e.g., ALT-88192

    @Column(nullable = false)
    private String subsystem; // SOAR, POSTURE, KEYVAULT, OTEL, SCIM, EVIDENCE

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String alertSummary;

    @Column(nullable = false)
    private String affectedComponent; // e.g., auth-service, ztna-gateway, hsm-vault

    @Column(nullable = false)
    private String resolutionStatus; // ACTIVE, ACKNOWLEDGED, RESOLVED

    private String acknowledgedBy;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
