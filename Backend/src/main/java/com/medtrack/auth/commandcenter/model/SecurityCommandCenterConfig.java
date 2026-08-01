package com.medtrack.auth.commandcenter.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing unified Security Command Center dashboard configuration.
 */
@Entity
@Table(name = "security_command_center_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityCommandCenterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configName; // e.g., DEFAULT_COMMAND_CENTER_CONFIG

    @Column(nullable = false)
    private int refreshIntervalSeconds;

    @Column(nullable = false, length = 1000)
    private String activeWidgets; // POSTURE_SCORE,OTEL_STREAMS,ACTIVE_CONTAINMENTS,WORM_LEDGER,SCIM_SYNC

    @Column(nullable = false)
    private int riskAlertThreshold; // e.g. 75 (%)

    @Column(nullable = false)
    private boolean autoAcknowledgeLowSeverity;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
