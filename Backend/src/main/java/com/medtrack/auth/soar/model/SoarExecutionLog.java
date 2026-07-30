package com.medtrack.auth.soar.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking execution audit runs of automated SOAR incident response playbooks.
 */
@Entity
@Table(name = "soar_execution_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoarExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String executionId; // e.g., EXEC-90102

    @Column(nullable = false)
    private String playbookId;

    @Column(nullable = false)
    private String triggerSource; // SIEM_ALERT, THREAT_INTEL, SOC_OPERATOR

    @Column(nullable = false)
    private String affectedResource; // host-10.0.4.12, user@medtrack-health.org, 192.168.1.100

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, IN_PROGRESS

    @Column(nullable = false, length = 2000)
    private String outputLog;

    @Column(nullable = false)
    private LocalDateTime executedAt;
}
