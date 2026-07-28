package com.medtrack.auth.sbom;

import com.medtrack.auth.sbom.dto.*;
import com.medtrack.auth.sbom.model.*;
import com.medtrack.auth.sbom.repository.*;
import com.medtrack.auth.sbom.service.SbomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SbomService}.
 */
@ExtendWith(MockitoExtension.class)
public class SbomServiceTest {

    @Mock
    private SbomArtifactConfigRepository artifactRepository;

    @Mock
    private SbomComponentRecordRepository componentRepository;

    private SbomService sbomService;

    @BeforeEach
    void setUp() {
        sbomService = new SbomService(artifactRepository, componentRepository);
    }

    @Test
    void registerArtifact_Success() {
        when(artifactRepository.findByArtifactId("medtrack-web:v1.0")).thenReturn(Optional.empty());
        when(artifactRepository.save(any())).thenAnswer(i -> {
            SbomArtifactConfig a = i.getArgument(0);
            a.setId(1L);
            return a;
        });

        RegisterSbomArtifactRequest request = RegisterSbomArtifactRequest.builder()
                .artifactId("medtrack-web:v1.0")
                .artifactType("DOCKER_IMAGE")
                .sha256Digest("a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef")
                .build();

        SbomArtifactConfigResponse response = sbomService.registerArtifact(request);

        assertNotNull(response);
        assertEquals("medtrack-web:v1.0", response.getArtifactId());
        assertEquals("COMPLIANT", response.getComplianceStatus());
    }

    @Test
    void generateAttestation_Success() {
        SbomArtifactConfig artifact = SbomArtifactConfig.builder()
                .id(1L)
                .artifactId("medtrack-backend-api:v2.4.0")
                .artifactType("DOCKER_IMAGE")
                .sha256Digest("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
                .complianceStatus("COMPLIANT")
                .build();

        SbomComponentRecord component = SbomComponentRecord.builder()
                .componentId("SBOM-90102")
                .artifactId("medtrack-backend-api:v2.4.0")
                .packageName("spring-security")
                .packageVersion("6.2.1")
                .licenseType("APACHE_2_0")
                .riskLevel("LOW")
                .directDependency(true)
                .build();

        when(artifactRepository.findByArtifactId("medtrack-backend-api:v2.4.0")).thenReturn(Optional.of(artifact));
        when(componentRepository.findByArtifactId("medtrack-backend-api:v2.4.0")).thenReturn(List.of(component));

        SbomAttestationReportResponse attestation = sbomService.generateAttestation("medtrack-backend-api:v2.4.0");

        assertNotNull(attestation);
        assertEquals("CERTIFIED_SAFE", attestation.getComplianceVerdict());
        assertEquals(1, attestation.getTotalComponents());
        assertNotNull(attestation.getAttestationSha256Checksum());
    }
}
