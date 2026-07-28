package com.medtrack.auth.microsegmentation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking active Software-Defined Perimeter (SDP) encrypted tunnel sessions.
 */
@Entity
@Table(name = "sdp_tunnel_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SdpTunnelSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sessionId; // e.g., SDP-87105

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String sourceIp;

    @Column(nullable = false)
    private String targetSegment; // PROD_HEALTH_DB, EHR_VAULT

    @Column(nullable = false)
    private String tunnelProtocol; // WIREGUARD_UDP, IPSEC_ESP

    @Column(nullable = false)
    private String status; // ESTABLISHED, TERMINATED

    @Column(nullable = false)
    private long txBytes;

    @Column(nullable = false)
    private long rxBytes;

    @Column(nullable = false)
    private LocalDateTime establishedAt;
}
