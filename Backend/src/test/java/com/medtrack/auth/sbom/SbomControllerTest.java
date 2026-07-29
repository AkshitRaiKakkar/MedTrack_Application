package com.medtrack.auth.sbom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.auth.sbom.controller.SbomController;
import com.medtrack.auth.sbom.dto.*;
import com.medtrack.auth.sbom.service.SbomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller unit tests for {@link SbomController}.
 */
@ExtendWith(MockitoExtension.class)
public class SbomControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SbomService sbomService;

    @InjectMocks
    private SbomController sbomController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sbomController).build();
    }

    @Test
    void registerArtifact_Success() throws Exception {
        SbomArtifactConfigResponse response = SbomArtifactConfigResponse.builder()
                .artifactId("medtrack-backend-api:v2.4.0")
                .complianceStatus("COMPLIANT")
                .build();

        when(sbomService.registerArtifact(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/sbom/artifacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(RegisterSbomArtifactRequest.builder()
                                .artifactId("medtrack-backend-api:v2.4.0")
                                .artifactType("DOCKER_IMAGE")
                                .sha256Digest("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.artifactId").value("medtrack-backend-api:v2.4.0"))
                .andExpect(jsonPath("$.complianceStatus").value("COMPLIANT"));
    }

    @Test
    void generateAttestation_Success() throws Exception {
        SbomAttestationReportResponse response = SbomAttestationReportResponse.builder()
                .artifactId("medtrack-backend-api:v2.4.0")
                .complianceVerdict("CERTIFIED_SAFE")
                .attestationSha256Checksum("8a9f029103...")
                .build();

        when(sbomService.generateAttestation("medtrack-backend-api:v2.4.0")).thenReturn(response);

        mockMvc.perform(get("/api/auth/sbom/attest")
                        .param("artifactId", "medtrack-backend-api:v2.4.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complianceVerdict").value("CERTIFIED_SAFE"))
                .andExpect(jsonPath("$.artifactId").value("medtrack-backend-api:v2.4.0"));
    }
}
