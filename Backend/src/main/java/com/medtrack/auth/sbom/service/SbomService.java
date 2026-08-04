package com.medtrack.auth.sbom.service;

import com.medtrack.auth.sbom.dto.*;
import com.medtrack.auth.sbom.model.*;
import com.medtrack.auth.sbom.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Software Bill of Materials (SBOM) CycloneDX/SPDX Compliance & Supply Chain Security Attestation.
 */
@Service
@RequiredArgsConstructor
public class SbomService {

    private final SbomArtifactConfigRepository artifactRepository;
    private final SbomComponentRecordRepository componentRepository;

    private static final String DEFAULT_ARTIFACT_ID = "medtrack-backend-api:v2.4.0";

    /**
     * Seeds baseline CycloneDX SBOM build artifact & open-source components.
     */
    @PostConstruct
    @Transactional
    public void seedSbomBaseline() {
        if (artifactRepository.findByArtifactId(DEFAULT_ARTIFACT_ID).isEmpty()) {
            SbomArtifactConfig artifact = SbomArtifactConfig.builder()
                    .artifactId(DEFAULT_ARTIFACT_ID)
                    .artifactType("DOCKER_IMAGE")
                    .sha256Digest("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
                    .complianceStatus("COMPLIANT")
                    .scannedAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            artifactRepository.save(artifact);
        }

        if (componentRepository.count() == 0) {
            seedSampleComponent("SBOM-90102", DEFAULT_ARTIFACT_ID, "org.springframework.security:spring-security-web", "6.2.1", "MAVEN", "APACHE_2_0", "LOW", true);
            seedSampleComponent("SBOM-87105", DEFAULT_ARTIFACT_ID, "com.fasterxml.jackson.core:jackson-databind", "2.16.1", "MAVEN", "APACHE_2_0", "LOW", true);
            seedSampleComponent("SBOM-74110", DEFAULT_ARTIFACT_ID, "org.bouncycastle:bcprov-jdk18on", "1.77", "MAVEN", "MIT", "LOW", false);
        }
    }

    private void seedSampleComponent(String compId, String artId, String name, String ver, String eco, String lic, String risk, boolean direct) {
        if (componentRepository.findByComponentId(compId).isEmpty()) {
            componentRepository.save(SbomComponentRecord.builder()
                    .componentId(compId)
                    .artifactId(artId)
                    .packageName(name)
                    .packageVersion(ver)
                    .ecosystem(eco)
                    .licenseType(lic)
                    .riskLevel(risk)
                    .directDependency(direct)
                    .detectedAt(LocalDateTime.now().minusHours(4))
                    .build());
        }
    }

    /**
     * Registers a new build artifact or container image for SBOM tracking.
     */
    @Transactional
    public SbomArtifactConfigResponse registerArtifact(RegisterSbomArtifactRequest request) {
        if (artifactRepository.findByArtifactId(request.getArtifactId()).isPresent()) {
            throw new IllegalArgumentException("Artifact already registered for SBOM tracking: " + request.getArtifactId());
        }

        SbomArtifactConfig artifact = SbomArtifactConfig.builder()
                .artifactId(request.getArtifactId())
                .artifactType(request.getArtifactType())
                .sha256Digest(request.getSha256Digest())
                .complianceStatus("COMPLIANT")
                .scannedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        SbomArtifactConfig saved = artifactRepository.save(artifact);
        return mapToArtifactResponse(saved);
    }

    /**
     * Ingests a new SBOM dependency component into an artifact bill of materials.
     */
    @Transactional
    public SbomComponentRecordResponse ingestComponent(IngestSbomComponentRequest request) {
        String compId = "SBOM-" + (10000 + new Random().nextInt(90000));
        String risk = "PROHIBITED".equalsIgnoreCase(request.getLicenseType()) || "GPL_3_0".equalsIgnoreCase(request.getLicenseType()) ? "PROHIBITED_LICENSE" : "LOW";

        SbomComponentRecord record = SbomComponentRecord.builder()
                .componentId(compId)
                .artifactId(request.getArtifactId())
                .packageName(request.getPackageName())
                .packageVersion(request.getPackageVersion())
                .ecosystem(request.getEcosystem())
                .licenseType(request.getLicenseType())
                .riskLevel(risk)
                .directDependency(request.isDirectDependency())
                .detectedAt(LocalDateTime.now())
                .build();

        SbomComponentRecord saved = componentRepository.save(record);

        // Update artifact compliance status if prohibited license found
        if ("PROHIBITED_LICENSE".equals(risk)) {
            artifactRepository.findByArtifactId(request.getArtifactId()).ifPresent(art -> {
                art.setComplianceStatus("NON_COMPLIANT");
                art.setUpdatedAt(LocalDateTime.now());
                artifactRepository.save(art);
            });
        }

        return mapToComponentResponse(saved);
    }

    /**
     * Generates cryptographic SHA-256 attestation report bundle for build artifact.
     */
    @Transactional(readOnly = true)
    public SbomAttestationReportResponse generateAttestation(String artifactId) {
        SbomArtifactConfig artifact = artifactRepository.findByArtifactId(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found: " + artifactId));

        List<SbomComponentRecord> components = componentRepository.findByArtifactId(artifactId);
        int directCount = (int) components.stream().filter(SbomComponentRecord::isDirectDependency).count();
        int prohibitedCount = (int) components.stream().filter(c -> "PROHIBITED_LICENSE".equals(c.getRiskLevel())).count();
        String verdict = prohibitedCount == 0 && "COMPLIANT".equals(artifact.getComplianceStatus()) ? "CERTIFIED_SAFE" : "REJECTED_NON_COMPLIANT";

        String rawContent = artifact.getArtifactId() + "|" + artifact.getSha256Digest() + "|" + components.size() + "|" + verdict;
        String checksum = computeSha256(rawContent);

        return SbomAttestationReportResponse.builder()
                .artifactId(artifact.getArtifactId())
                .artifactType(artifact.getArtifactType())
                .sha256Digest(artifact.getSha256Digest())
                .totalComponents(components.size())
                .directDependenciesCount(directCount)
                .prohibitedLicenseCount(prohibitedCount)
                .attestationSha256Checksum(checksum)
                .complianceVerdict(verdict)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Retrieves all registered build artifacts.
     */
    @Transactional(readOnly = true)
    public List<SbomArtifactConfigResponse> getAllArtifacts() {
        return artifactRepository.findAll().stream()
                .map(this::mapToArtifactResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all SBOM dependency component records.
     */
    @Transactional(readOnly = true)
    public List<SbomComponentRecordResponse> getAllComponents() {
        return componentRepository.findAll().stream()
                .map(this::mapToComponentResponse)
                .collect(Collectors.toList());
    }

    private SbomArtifactConfigResponse mapToArtifactResponse(SbomArtifactConfig a) {
        return SbomArtifactConfigResponse.builder()
                .id(a.getId())
                .artifactId(a.getArtifactId())
                .artifactType(a.getArtifactType())
                .sha256Digest(a.getSha256Digest())
                .complianceStatus(a.getComplianceStatus())
                .scannedAt(a.getScannedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private SbomComponentRecordResponse mapToComponentResponse(SbomComponentRecord c) {
        return SbomComponentRecordResponse.builder()
                .id(c.getId())
                .componentId(c.getComponentId())
                .artifactId(c.getArtifactId())
                .packageName(c.getPackageName())
                .packageVersion(c.getPackageVersion())
                .ecosystem(c.getEcosystem())
                .licenseType(c.getLicenseType())
                .riskLevel(c.getRiskLevel())
                .directDependency(c.isDirectDependency())
                .detectedAt(c.getDetectedAt())
                .build();
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "SHA256-ERROR";
        }
    }
}
