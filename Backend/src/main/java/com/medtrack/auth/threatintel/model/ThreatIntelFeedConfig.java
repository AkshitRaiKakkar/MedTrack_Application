package com.medtrack.auth.threatintel.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing threat intelligence STIX/TAXII feed configuration.
 */
@Entity
@Table(name = "threat_intel_feed_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatIntelFeedConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String feedName; // e.g., STIX_TAXII_FEED

    @Column(nullable = false)
    private String providerName; // ALIENVAULT_OTX, MISP_THREAT_HUB, MANDIANT_INTEL

    @Column(nullable = false)
    private int updateIntervalHours;

    @Column(nullable = false)
    private int minimumConfidenceScore; // 0-100 threshold

    @Column(nullable = false)
    private boolean autoBlockHighConfidence;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
