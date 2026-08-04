package com.medtrack.auth.cspm.service;

import com.medtrack.auth.cspm.dto.*;
import com.medtrack.auth.cspm.model.*;
import com.medtrack.auth.cspm.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Cloud Security Posture Management (CSPM) & Multi-Cloud CIS Compliance Scans.
 */
@Service
@RequiredArgsConstructor
public class CspmService {

    private final CspmCloudAccountRepository accountRepository;
    private final CspmSecurityFindingRepository findingRepository;

    private static final String DEFAULT_ACCOUNT_NUMBER = "AWS-19203910";

    /**
     * Seeds baseline connected cloud accounts & CIS benchmark misconfiguration findings.
     */
    @PostConstruct
    @Transactional
    public void seedCspmBaseline() {
        if (accountRepository.findByAccountNumber(DEFAULT_ACCOUNT_NUMBER).isEmpty()) {
            CspmCloudAccount account = CspmCloudAccount.builder()
                    .accountNumber(DEFAULT_ACCOUNT_NUMBER)
                    .provider("AWS")
                    .accountName("Production-Medical-Cloud-US")
                    .region("us-west-2")
                    .syncStatus("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .lastSyncedAt(LocalDateTime.now())
                    .build();
            accountRepository.save(account);
        }

        if (findingRepository.count() == 0) {
            seedSampleFinding("CSPM-90102", DEFAULT_ACCOUNT_NUMBER, "s3://medtrack-patient-vault", "S3_BUCKET", "CRITICAL", "HIPAA_CLOUD_SECURITY", "Public read access enabled on patient data bucket", "OPEN", "aws s3api put-public-access-block --bucket medtrack-patient-vault --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true");
            seedSampleFinding("CSPM-87105", DEFAULT_ACCOUNT_NUMBER, "arn:aws:iam::19203910:role/AdminRole", "IAM_ROLE", "HIGH", "CIS_AWS_FOUNDATIONS_1_5", "Wildcard IAM AdministratorAccess policy attached to worker node", "OPEN", "aws iam detach-role-policy --role-name AdminRole --policy-arn arn:aws:iam::aws:policy/AdministratorAccess");
            seedSampleFinding("CSPM-74110", DEFAULT_ACCOUNT_NUMBER, "eks-prod-medical-cluster", "K8S_CLUSTER", "MEDIUM", "CIS_K8S_BENCHMARK_1_7", "Kubernetes API server anonymous authentication enabled", "REMEDIATED", "kubectl patch clusterrolebinding anonymous --type=json -p='[{\"op\": \"remove\", \"path\": \"/roleRef\"}]'");
        }
    }

    private void seedSampleFinding(String findId, String acc, String resId, String type, String sev, String bench, String desc, String status, String cmd) {
        if (findingRepository.findByFindingId(findId).isEmpty()) {
            findingRepository.save(CspmSecurityFinding.builder()
                    .findingId(findId)
                    .accountNumber(acc)
                    .resourceId(resId)
                    .resourceType(type)
                    .severity(sev)
                    .benchmark(bench)
                    .description(desc)
                    .status(status)
                    .remediationCommand(cmd)
                    .detectedAt(LocalDateTime.now().minusDays(1))
                    .remediatedAt("REMEDIATED".equals(status) ? LocalDateTime.now() : null)
                    .build());
        }
    }

    /**
     * Registers a new connected cloud account.
     */
    @Transactional
    public CspmCloudAccountResponse registerCloudAccount(RegisterCloudAccountRequest request) {
        if (accountRepository.findByAccountNumber(request.getAccountNumber()).isPresent()) {
            throw new IllegalArgumentException("Cloud account already registered: " + request.getAccountNumber());
        }

        CspmCloudAccount account = CspmCloudAccount.builder()
                .accountNumber(request.getAccountNumber())
                .provider(request.getProvider())
                .accountName(request.getAccountName())
                .region(request.getRegion())
                .syncStatus("ACTIVE")
                .createdAt(LocalDateTime.now())
                .lastSyncedAt(LocalDateTime.now())
                .build();

        CspmCloudAccount saved = accountRepository.save(account);
        return mapToAccountResponse(saved);
    }

    /**
     * Ingests a new CSPM security misconfiguration finding.
     */
    @Transactional
    public CspmSecurityFindingResponse ingestFinding(IngestCspmFindingRequest request) {
        String findingId = "CSPM-" + (10000 + new Random().nextInt(90000));
        CspmSecurityFinding finding = CspmSecurityFinding.builder()
                .findingId(findingId)
                .accountNumber(request.getAccountNumber())
                .resourceId(request.getResourceId())
                .resourceType(request.getResourceType())
                .severity(request.getSeverity())
                .benchmark(request.getBenchmark())
                .description(request.getDescription())
                .status("OPEN")
                .remediationCommand(request.getRemediationCommand())
                .detectedAt(LocalDateTime.now())
                .build();

        CspmSecurityFinding saved = findingRepository.save(finding);
        return mapToFindingResponse(saved);
    }

    /**
     * Executes remediation for an open CSPM finding.
     */
    @Transactional
    public CspmSecurityFindingResponse remediateFinding(String findingId) {
        CspmSecurityFinding finding = findingRepository.findByFindingId(findingId)
                .orElseThrow(() -> new IllegalArgumentException("CSPM finding not found: " + findingId));

        finding.setStatus("REMEDIATED");
        finding.setRemediatedAt(LocalDateTime.now());

        CspmSecurityFinding updated = findingRepository.save(finding);
        return mapToFindingResponse(updated);
    }

    /**
     * Retrieves all registered cloud accounts.
     */
    @Transactional(readOnly = true)
    public List<CspmCloudAccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToAccountResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all CSPM security findings.
     */
    @Transactional(readOnly = true)
    public List<CspmSecurityFindingResponse> getAllFindings() {
        return findingRepository.findAll().stream()
                .map(this::mapToFindingResponse)
                .collect(Collectors.toList());
    }

    private CspmCloudAccountResponse mapToAccountResponse(CspmCloudAccount a) {
        return CspmCloudAccountResponse.builder()
                .id(a.getId())
                .accountNumber(a.getAccountNumber())
                .provider(a.getProvider())
                .accountName(a.getAccountName())
                .region(a.getRegion())
                .syncStatus(a.getSyncStatus())
                .createdAt(a.getCreatedAt())
                .lastSyncedAt(a.getLastSyncedAt())
                .build();
    }

    private CspmSecurityFindingResponse mapToFindingResponse(CspmSecurityFinding f) {
        return CspmSecurityFindingResponse.builder()
                .id(f.getId())
                .findingId(f.getFindingId())
                .accountNumber(f.getAccountNumber())
                .resourceId(f.getResourceId())
                .resourceType(f.getResourceType())
                .severity(f.getSeverity())
                .benchmark(f.getBenchmark())
                .description(f.getDescription())
                .status(f.getStatus())
                .remediationCommand(f.getRemediationCommand())
                .detectedAt(f.getDetectedAt())
                .remediatedAt(f.getRemediatedAt())
                .build();
    }
}
