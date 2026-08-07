package com.medtrack.auth.microsegmentation.service;

import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.model.*;
import com.medtrack.auth.microsegmentation.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Zero-Trust Microsegmentation Policies & Software-Defined Perimeter (SDP) Tunnels.
 */
@Service
@RequiredArgsConstructor
public class MicrosegmentationService {

    private final MicrosegmentationPolicyRepository policyRepository;
    private final SdpTunnelSessionRepository tunnelRepository;

    /**
     * Seeds baseline microsegmentation rules & SDP tunnel telemetry.
     */
    @PostConstruct
    @Transactional
    public void seedMicrosegmentationBaseline() {
        if (policyRepository.count() == 0) {
            seedSamplePolicy("SEG-90102", "PATIENT_PORTAL_DMZ", "PROD_HEALTH_DB", "TCP", "5432", "ENCRYPTED_MTLS_ONLY", "STRICT_ALLOW");
            seedSamplePolicy("SEG-87105", "WORKSTATION_LAN", "EHR_VAULT", "TCP", "443", "DEVICE_POSTURE_PASSED", "STRICT_ALLOW");
            seedSamplePolicy("SEG-74110", "GUEST_WIFI_VLAN", "INTERNAL_API_GATEWAY", "ALL", "*", "NONE", "BLOCK");
        }

        if (tunnelRepository.count() == 0) {
            seedSampleTunnel("SDP-87105", "operator@medtrack-health.org", "10.200.4.12", "PROD_HEALTH_DB", "WIREGUARD_UDP", 1048576L, 4194304L);
            seedSampleTunnel("SDP-65120", "doctor.smith@medtrack-health.org", "10.200.8.44", "EHR_VAULT", "WIREGUARD_UDP", 524288L, 2097152L);
        }
    }

    private void seedSamplePolicy(String ruleId, String src, String dst, String proto, String port, String posture, String act) {
        if (policyRepository.findByRuleId(ruleId).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            policyRepository.save(MicrosegmentationPolicy.builder()
                    .ruleId(ruleId)
                    .sourceSegment(src)
                    .destinationSegment(dst)
                    .allowedProtocol(proto)
                    .portRange(port)
                    .postureRequirement(posture)
                    .action(act)
                    .status("ACTIVE")
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
    }

    private void seedSampleTunnel(String sId, String email, String ip, String target, String proto, long tx, long rx) {
        if (tunnelRepository.findBySessionId(sId).isEmpty()) {
            tunnelRepository.save(SdpTunnelSession.builder()
                    .sessionId(sId)
                    .userEmail(email)
                    .sourceIp(ip)
                    .targetSegment(target)
                    .tunnelProtocol(proto)
                    .status("ESTABLISHED")
                    .txBytes(tx)
                    .rxBytes(rx)
                    .establishedAt(LocalDateTime.now().minusHours(1))
                    .build());
        }
    }

    /**
     * Creates a new network microsegmentation isolation rule.
     */
    @Transactional
    public MicrosegmentationPolicyResponse createRule(CreateMicrosegmentationRuleRequest request) {
        String ruleId = "SEG-" + (10000 + new Random().nextInt(90000));
        LocalDateTime now = LocalDateTime.now();

        MicrosegmentationPolicy policy = MicrosegmentationPolicy.builder()
                .ruleId(ruleId)
                .sourceSegment(request.getSourceSegment())
                .destinationSegment(request.getDestinationSegment())
                .allowedProtocol(request.getAllowedProtocol())
                .portRange(request.getPortRange())
                .postureRequirement(request.getPostureRequirement())
                .action(request.getAction())
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        MicrosegmentationPolicy saved = policyRepository.save(policy);
        return mapToPolicyResponse(saved);
    }

    /**
     * Establishes a Software-Defined Perimeter (SDP) encrypted tunnel session.
     */
    @Transactional
    public SdpTunnelSessionResponse establishTunnel(EstablishSdpTunnelRequest request) {
        String sessionId = "SDP-" + (10000 + new Random().nextInt(90000));

        SdpTunnelSession tunnel = SdpTunnelSession.builder()
                .sessionId(sessionId)
                .userEmail(request.getUserEmail())
                .sourceIp(request.getSourceIp())
                .targetSegment(request.getTargetSegment())
                .tunnelProtocol(request.getTunnelProtocol())
                .status("ESTABLISHED")
                .txBytes(2048L)
                .rxBytes(8192L)
                .establishedAt(LocalDateTime.now())
                .build();

        SdpTunnelSession saved = tunnelRepository.save(tunnel);
        return mapToTunnelResponse(saved);
    }

    /**
     * Toggles microsegmentation policy active status.
     */
    @Transactional
    public MicrosegmentationPolicyResponse toggleRuleStatus(String ruleId, boolean active) {
        MicrosegmentationPolicy policy = policyRepository.findByRuleId(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Microsegmentation rule not found: " + ruleId));

        policy.setStatus(active ? "ACTIVE" : "DISABLED");
        policy.setUpdatedAt(LocalDateTime.now());

        MicrosegmentationPolicy updated = policyRepository.save(policy);
        return mapToPolicyResponse(updated);
    }

    /**
     * Terminates an active SDP tunnel session.
     */
    @Transactional
    public SdpTunnelSessionResponse terminateTunnel(String sessionId) {
        SdpTunnelSession tunnel = tunnelRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("SDP Tunnel session not found: " + sessionId));

        tunnel.setStatus("TERMINATED");
        SdpTunnelSession updated = tunnelRepository.save(tunnel);
        return mapToTunnelResponse(updated);
    }

    /**
     * Retrieves all microsegmentation policies.
     */
    @Transactional(readOnly = true)
    public List<MicrosegmentationPolicyResponse> getAllPolicies() {
        return policyRepository.findAll().stream()
                .map(this::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all SDP tunnel sessions.
     */
    @Transactional(readOnly = true)
    public List<SdpTunnelSessionResponse> getAllTunnels() {
        return tunnelRepository.findAll().stream()
                .map(this::mapToTunnelResponse)
                .collect(Collectors.toList());
    }

    private MicrosegmentationPolicyResponse mapToPolicyResponse(MicrosegmentationPolicy p) {
        return MicrosegmentationPolicyResponse.builder()
                .id(p.getId())
                .ruleId(p.getRuleId())
                .sourceSegment(p.getSourceSegment())
                .destinationSegment(p.getDestinationSegment())
                .allowedProtocol(p.getAllowedProtocol())
                .portRange(p.getPortRange())
                .postureRequirement(p.getPostureRequirement())
                .action(p.getAction())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private SdpTunnelSessionResponse mapToTunnelResponse(SdpTunnelSession t) {
        return SdpTunnelSessionResponse.builder()
                .id(t.getId())
                .sessionId(t.getSessionId())
                .userEmail(t.getUserEmail())
                .sourceIp(t.getSourceIp())
                .targetSegment(t.getTargetSegment())
                .tunnelProtocol(t.getTunnelProtocol())
                .status(t.getStatus())
                .txBytes(t.getTxBytes())
                .rxBytes(t.getRxBytes())
                .establishedAt(t.getEstablishedAt())
                .build();
    }
}
