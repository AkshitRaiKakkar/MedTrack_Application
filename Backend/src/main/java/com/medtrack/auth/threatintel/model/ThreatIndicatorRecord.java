package com.medtrack.auth.threatintel.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an ingested Indicator of Compromise (IOC).
 */
@Entity
@Table(name = "threat_indicator_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatIndicatorRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String indicatorValue; // e.g., 198.51.100.45 or bad-malware-c2.org

    @Column(nullable = false)
    private String indicatorType; // IP_ADDRESS, DOMAIN_NAME, FILE_HASH

    @Column(nullable = false)
    private String threatCategory; // MALWARE_C2, PHISHING, RANSOMWARE, BOTNET

    @Column(nullable = false)
    private int confidenceScore; // 0 to 100

    @Column(nullable = false)
    private String status; // ACTIVE, BLOCKED, WHITELISTED

    @Column(nullable = false)
    private LocalDateTime discoveredAt;

    private LocalDateTime mitigatedAt;
}
