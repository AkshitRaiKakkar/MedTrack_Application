package com.medtrack.auth.microsegmentation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing network microsegmentation security policies and perimeter isolation rules.
 */
@Entity
@Table(name = "microsegmentation_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MicrosegmentationPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ruleId; // e.g., SEG-90102

    @Column(nullable = false)
    private String sourceSegment; // PATIENT_PORTAL_DMZ, WORKSTATION_LAN

    @Column(nullable = false)
    private String destinationSegment; // PROD_HEALTH_DB, EHR_VAULT

    @Column(nullable = false)
    private String allowedProtocol; // TCP, UDP, ICMP

    @Column(nullable = false)
    private String portRange; // 5432, 443, 8443

    @Column(nullable = false)
    private String postureRequirement; // ENCRYPTED_MTLS_ONLY, DEVICE_POSTURE_PASSED

    @Column(nullable = false)
    private String action; // STRICT_ALLOW, BLOCK

    @Column(nullable = false)
    private String status; // ACTIVE, DISABLED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
