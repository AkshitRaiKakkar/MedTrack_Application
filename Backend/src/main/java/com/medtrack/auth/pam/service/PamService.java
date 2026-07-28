package com.medtrack.auth.pam.service;

import com.medtrack.auth.pam.dto.*;
import com.medtrack.auth.pam.model.*;
import com.medtrack.auth.pam.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Enterprise Privileged Access Management (PAM) & Just-In-Time (JIT) Credential Elevation.
 */
@Service
@RequiredArgsConstructor
public class PamService {

    private final PamPolicyConfigRepository policyRepository;
    private final PamAccessRequestRepository requestRepository;
    private final PamSessionAuditLogRepository sessionLogRepository;

    private static final String DEFAULT_POLICY_NAME = "MASTER_PAM_POLICY";

    /**
     * Seeds baseline PAM policy & sample JIT elevation requests.
     */
    @PostConstruct
    @Transactional
    public void seedPamBaseline() {
        if (policyRepository.findByPolicyName(DEFAULT_POLICY_NAME).isEmpty()) {
            PamPolicyConfig config = PamPolicyConfig.builder()
                    .policyName(DEFAULT_POLICY_NAME)
                    .maxSessionMinutes(60)
                    .autoApproveLowRisk(true)
                    .requireMfaElevation(true)
                    .requireTicketNumber(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            policyRepository.save(config);
        }

        if (requestRepository.count() == 0) {
            seedSampleRequest("PAM-90102", "devops.lead@medtrack-health.org", "PROD_PATIENT_DB", "ROLE_DBA", 30, "Emergency schema migration for hotfix", "SEC-8891", "APPROVED", "CHIEF_SECURITY_OFFICER");
            seedSampleRequest("PAM-87105", "sysadmin@medtrack-health.org", "K8S_PROD_CLUSTER", "ROLE_SYSADMIN", 60, "Node kernel upgrade patching", "SEC-8842", "APPROVED", "CHIEF_SECURITY_OFFICER");
            seedSampleRequest("PAM-74110", "auditor@medtrack-health.org", "VAULT_SECRETS", "ROLE_SECURITY_AUDITOR", 45, "SOC2 compliance audit inspection", "SEC-8720", "PENDING", null);
        }
    }

    private void seedSampleRequest(String reqId, String email, String res, String role, int dur, String reason, String ticket, String status, String approver) {
        if (requestRepository.findByRequestId(reqId).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            requestRepository.save(PamAccessRequest.builder()
                    .requestId(reqId)
                    .requesterEmail(email)
                    .targetResource(res)
                    .requestedRole(role)
                    .durationMinutes(dur)
                    .reason(reason)
                    .ticketNumber(ticket)
                    .status(status)
                    .approvedBy(approver)
                    .requestedAt(now.minusHours(1))
                    .expiresAt("APPROVED".equals(status) ? now.plusMinutes(dur) : null)
                    .build());
        }
    }

    /**
     * Retrieves active PAM policy configuration.
     */
    @Transactional(readOnly = true)
    public PamPolicyConfigResponse getActivePolicy() {
        PamPolicyConfig config = getOrCreatePolicy();
        return mapToPolicyResponse(config);
    }

    /**
     * Updates PAM policy configuration settings.
     */
    @Transactional
    public PamPolicyConfigResponse updatePolicy(UpdatePamPolicyRequest request) {
        PamPolicyConfig config = getOrCreatePolicy();
        config.setMaxSessionMinutes(request.getMaxSessionMinutes());
        config.setAutoApproveLowRisk(request.isAutoApproveLowRisk());
        config.setRequireMfaElevation(request.isRequireMfaElevation());
        config.setRequireTicketNumber(request.isRequireTicketNumber());
        config.setUpdatedAt(LocalDateTime.now());

        PamPolicyConfig updated = policyRepository.save(config);
        return mapToPolicyResponse(updated);
    }

    /**
     * Creates a new JIT Privileged Access Request.
     */
    @Transactional
    public PamAccessRequestResponse createAccessRequest(CreatePamAccessRequest request) {
        PamPolicyConfig policy = getOrCreatePolicy();
        
        if (policy.isRequireTicketNumber() && (request.getTicketNumber() == null || request.getTicketNumber().isBlank())) {
            throw new IllegalArgumentException("Ticket number (JIRA/ServiceNow) is required under active PAM policy.");
        }

        String requestId = "PAM-" + (10000 + new Random().nextInt(90000));
        boolean autoApprove = policy.isAutoApproveLowRisk() && request.getDurationMinutes() <= 30;
        String status = autoApprove ? "APPROVED" : "PENDING";
        String approver = autoApprove ? "AUTOMATED_PAM_ENGINE" : null;
        LocalDateTime now = LocalDateTime.now();

        PamAccessRequest pamRequest = PamAccessRequest.builder()
                .requestId(requestId)
                .requesterEmail(request.getRequesterEmail())
                .targetResource(request.getTargetResource())
                .requestedRole(request.getRequestedRole())
                .durationMinutes(request.getDurationMinutes())
                .reason(request.getReason())
                .ticketNumber(request.getTicketNumber())
                .status(status)
                .approvedBy(approver)
                .requestedAt(now)
                .expiresAt(autoApprove ? now.plusMinutes(request.getDurationMinutes()) : null)
                .build();

        PamAccessRequest saved = requestRepository.save(pamRequest);
        return mapToRequestResponse(saved);
    }

    /**
     * Approves an active JIT elevation request.
     */
    @Transactional
    public PamAccessRequestResponse approveRequest(String requestId, String approver) {
        PamAccessRequest request = requestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("PAM request not found: " + requestId));

        request.setStatus("APPROVED");
        request.setApprovedBy(approver);
        request.setExpiresAt(LocalDateTime.now().plusMinutes(request.getDurationMinutes()));

        PamAccessRequest updated = requestRepository.save(request);
        return mapToRequestResponse(updated);
    }

    /**
     * Records command execution during an active elevated PAM session.
     */
    @Transactional
    public PamSessionAuditLogResponse recordSessionLog(RecordPamSessionLogRequest request) {
        String sessionId = "SES-" + (10000 + new Random().nextInt(90000));
        PamSessionAuditLog log = PamSessionAuditLog.builder()
                .sessionId(sessionId)
                .requestId(request.getRequestId())
                .operatorEmail(request.getOperatorEmail())
                .actionExecuted(request.getActionExecuted())
                .riskScore(request.getRiskScore())
                .timestamp(LocalDateTime.now())
                .build();

        PamSessionAuditLog saved = sessionLogRepository.save(log);
        return mapToAuditLogResponse(saved);
    }

    /**
     * Retrieves all JIT access elevation requests.
     */
    @Transactional(readOnly = true)
    public List<PamAccessRequestResponse> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(this::mapToRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all PAM session command execution logs.
     */
    @Transactional(readOnly = true)
    public List<PamSessionAuditLogResponse> getAllSessionLogs() {
        return sessionLogRepository.findAll().stream()
                .map(this::mapToAuditLogResponse)
                .collect(Collectors.toList());
    }

    private PamPolicyConfig getOrCreatePolicy() {
        return policyRepository.findByPolicyName(DEFAULT_POLICY_NAME)
                .orElseGet(() -> policyRepository.save(PamPolicyConfig.builder()
                        .policyName(DEFAULT_POLICY_NAME)
                        .maxSessionMinutes(60)
                        .autoApproveLowRisk(true)
                        .requireMfaElevation(true)
                        .requireTicketNumber(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    private PamPolicyConfigResponse mapToPolicyResponse(PamPolicyConfig p) {
        return PamPolicyConfigResponse.builder()
                .id(p.getId())
                .policyName(p.getPolicyName())
                .maxSessionMinutes(p.getMaxSessionMinutes())
                .autoApproveLowRisk(p.isAutoApproveLowRisk())
                .requireMfaElevation(p.isRequireMfaElevation())
                .requireTicketNumber(p.isRequireTicketNumber())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private PamAccessRequestResponse mapToRequestResponse(PamAccessRequest r) {
        return PamAccessRequestResponse.builder()
                .id(r.getId())
                .requestId(r.getRequestId())
                .requesterEmail(r.getRequesterEmail())
                .targetResource(r.getTargetResource())
                .requestedRole(r.getRequestedRole())
                .durationMinutes(r.getDurationMinutes())
                .reason(r.getReason())
                .ticketNumber(r.getTicketNumber())
                .status(r.getStatus())
                .approvedBy(r.getApprovedBy())
                .requestedAt(r.getRequestedAt())
                .expiresAt(r.getExpiresAt())
                .build();
    }

    private PamSessionAuditLogResponse mapToAuditLogResponse(PamSessionAuditLog l) {
        return PamSessionAuditLogResponse.builder()
                .id(l.getId())
                .sessionId(l.getSessionId())
                .requestId(l.getRequestId())
                .operatorEmail(l.getOperatorEmail())
                .actionExecuted(l.getActionExecuted())
                .riskScore(l.getRiskScore())
                .timestamp(l.getTimestamp())
                .build();
    }
}
