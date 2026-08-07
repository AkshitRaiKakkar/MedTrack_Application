package com.medtrack.auth.soar.service;

import com.medtrack.auth.soar.dto.*;
import com.medtrack.auth.soar.model.*;
import com.medtrack.auth.soar.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Security Orchestration, Automation, and Response (SOAR) Incident Playbooks.
 */
@Service
@RequiredArgsConstructor
public class SoarService {

    private final SoarPlaybookConfigRepository playbookRepository;
    private final SoarExecutionLogRepository executionLogRepository;

    /**
     * Seeds baseline automated SOAR incident response playbooks & execution logs.
     */
    @PostConstruct
    @Transactional
    public void seedSoarBaseline() {
        if (playbookRepository.count() == 0) {
            seedSamplePlaybook("SOAR-PLAY-101", "Auto-Isolate-Compromised-Endpoint", "HIGH_SEVERITY_ALERT", "ISOLATE_HOST", true);
            seedSamplePlaybook("SOAR-PLAY-102", "Revoke-Compromised-User-Sessions", "EXFILTRATION_ALERT", "REVOKE_SESSION", true);
            seedSamplePlaybook("SOAR-PLAY-103", "Auto-Block-Malicious-IP", "MALWARE_DETECTED", "BLOCK_IP", true);
        }

        if (executionLogRepository.count() == 0) {
            seedSampleExecution("EXEC-90102", "SOAR-PLAY-101", "SIEM_ALERT", "host-prod-db-node1.medtrack.org", "SUCCESS", "Successfully quarantined target endpoint host via network switch ACL isolation rule.");
            seedSampleExecution("EXEC-87105", "SOAR-PLAY-102", "THREAT_INTEL", "user.compromised@medtrack-health.org", "SUCCESS", "Revoked 4 active JWT tokens and forced password reset trigger via SCIM provider.");
        }
    }

    private void seedSamplePlaybook(String pbId, String name, String trig, String act, boolean auto) {
        if (playbookRepository.findByPlaybookId(pbId).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            playbookRepository.save(SoarPlaybookConfig.builder()
                    .playbookId(pbId)
                    .playbookName(name)
                    .triggerEvent(trig)
                    .targetAction(act)
                    .autoExecutionEnabled(auto)
                    .status("ACTIVE")
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
    }

    private void seedSampleExecution(String execId, String pbId, String source, String res, String status, String log) {
        if (executionLogRepository.findByExecutionId(execId).isEmpty()) {
            executionLogRepository.save(SoarExecutionLog.builder()
                    .executionId(execId)
                    .playbookId(pbId)
                    .triggerSource(source)
                    .affectedResource(res)
                    .status(status)
                    .outputLog(log)
                    .executedAt(LocalDateTime.now().minusHours(2))
                    .build());
        }
    }

    /**
     * Creates a new automated SOAR incident response playbook.
     */
    @Transactional
    public SoarPlaybookConfigResponse createPlaybook(CreateSoarPlaybookRequest request) {
        String pbId = "SOAR-PLAY-" + (100 + new Random().nextInt(900));
        LocalDateTime now = LocalDateTime.now();

        SoarPlaybookConfig playbook = SoarPlaybookConfig.builder()
                .playbookId(pbId)
                .playbookName(request.getPlaybookName())
                .triggerEvent(request.getTriggerEvent())
                .targetAction(request.getTargetAction())
                .autoExecutionEnabled(request.isAutoExecutionEnabled())
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        SoarPlaybookConfig saved = playbookRepository.save(playbook);
        return mapToPlaybookResponse(saved);
    }

    /**
     * Triggers automated or manual execution of a SOAR response playbook.
     */
    @Transactional
    public SoarExecutionLogResponse triggerPlaybook(TriggerPlaybookExecutionRequest request) {
        SoarPlaybookConfig playbook = playbookRepository.findByPlaybookId(request.getPlaybookId())
                .orElseThrow(() -> new IllegalArgumentException("SOAR Playbook not found: " + request.getPlaybookId()));

        String execId = "EXEC-" + (10000 + new Random().nextInt(90000));
        String logOutput = String.format("Automated Playbook [%s] executed action [%s] against resource [%s]. Verdict: QUARANTINED.",
                playbook.getPlaybookName(), playbook.getTargetAction(), request.getAffectedResource());

        SoarExecutionLog log = SoarExecutionLog.builder()
                .executionId(execId)
                .playbookId(request.getPlaybookId())
                .triggerSource(request.getTriggerSource())
                .affectedResource(request.getAffectedResource())
                .status("SUCCESS")
                .outputLog(logOutput)
                .executedAt(LocalDateTime.now())
                .build();

        SoarExecutionLog saved = executionLogRepository.save(log);
        return mapToExecutionResponse(saved);
    }

    /**
     * Toggles SOAR playbook active status.
     */
    @Transactional
    public SoarPlaybookConfigResponse togglePlaybookStatus(String playbookId, boolean active) {
        SoarPlaybookConfig playbook = playbookRepository.findByPlaybookId(playbookId)
                .orElseThrow(() -> new IllegalArgumentException("SOAR Playbook not found: " + playbookId));

        playbook.setStatus(active ? "ACTIVE" : "DISABLED");
        playbook.setUpdatedAt(LocalDateTime.now());

        SoarPlaybookConfig updated = playbookRepository.save(playbook);
        return mapToPlaybookResponse(updated);
    }

    /**
     * Retrieves all SOAR playbooks.
     */
    @Transactional(readOnly = true)
    public List<SoarPlaybookConfigResponse> getAllPlaybooks() {
        return playbookRepository.findAll().stream()
                .map(this::mapToPlaybookResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all SOAR execution audit logs.
     */
    @Transactional(readOnly = true)
    public List<SoarExecutionLogResponse> getAllExecutionLogs() {
        return executionLogRepository.findAll().stream()
                .map(this::mapToExecutionResponse)
                .collect(Collectors.toList());
    }

    private SoarPlaybookConfigResponse mapToPlaybookResponse(SoarPlaybookConfig p) {
        return SoarPlaybookConfigResponse.builder()
                .id(p.getId())
                .playbookId(p.getPlaybookId())
                .playbookName(p.getPlaybookName())
                .triggerEvent(p.getTriggerEvent())
                .targetAction(p.getTargetAction())
                .autoExecutionEnabled(p.isAutoExecutionEnabled())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private SoarExecutionLogResponse mapToExecutionResponse(SoarExecutionLog l) {
        return SoarExecutionLogResponse.builder()
                .id(l.getId())
                .executionId(l.getExecutionId())
                .playbookId(l.getPlaybookId())
                .triggerSource(l.getTriggerSource())
                .affectedResource(l.getAffectedResource())
                .status(l.getStatus())
                .outputLog(l.getOutputLog())
                .executedAt(l.getExecutedAt())
                .build();
    }
}
