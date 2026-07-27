package com.medtrack.auth.threatintel.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking threat mitigation firewall/WAF execution logs.
 */
@Entity
@Table(name = "threat_mitigation_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatMitigationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String mitigationId; // e.g., MIT-90102

    @Column(nullable = false)
    private String indicatorValue;

    @Column(nullable = false)
    private String mitigationAction; // IP_BLOCK, DOMAIN_SINKHOLE, CONTAINER_ISOLATE

    @Column(nullable = false)
    private String executedBy;

    @Column(nullable = false)
    private String executionStatus; // EXECUTED, FAILED

    @Column(nullable = false, length = 1000)
    private String details;

    @Column(nullable = false)
    private LocalDateTime executedAt;
}
