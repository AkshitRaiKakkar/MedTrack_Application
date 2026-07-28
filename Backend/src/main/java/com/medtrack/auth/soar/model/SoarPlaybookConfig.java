package com.medtrack.auth.soar.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an automated Security Orchestration, Automation, and Response (SOAR) playbook.
 */
@Entity
@Table(name = "soar_playbook_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoarPlaybookConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String playbookId; // e.g., SOAR-PLAY-101

    @Column(nullable = false)
    private String playbookName; // Auto-Quarantine-Compromised-Host

    @Column(nullable = false)
    private String triggerEvent; // HIGH_SEVERITY_ALERT, MALWARE_DETECTED, EXFILTRATION_ALERT

    @Column(nullable = false)
    private String targetAction; // ISOLATE_HOST, REVOKE_SESSION, BLOCK_IP, LOCK_USER_ACCOUNT

    @Column(nullable = false)
    private boolean autoExecutionEnabled;

    @Column(nullable = false)
    private String status; // ACTIVE, DISABLED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
