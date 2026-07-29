package com.medtrack.auth.sbom.controller;

import com.medtrack.auth.sbom.dto.*;
import com.medtrack.auth.sbom.service.SbomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Software Bill of Materials (SBOM) & Supply Chain Security Attestation.
 */
@RestController
@RequestMapping("/api/auth/sbom")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "SBOM Supply Chain Security Subsystem", description = "APIs for CycloneDX/SPDX dependency tracking, build artifact registration, license risk analysis, and SHA-256 supply chain attestation.")
public class SbomController {

    private final SbomService sbomService;

    @GetMapping("/artifacts")
    @Operation(summary = "Get All Registered Artifacts", description = "Retrieves all tracked container images and build artifacts.")
    public ResponseEntity<List<SbomArtifactConfigResponse>> getAllArtifacts() {
        List<SbomArtifactConfigResponse> artifacts = sbomService.getAllArtifacts();
        return ResponseEntity.ok(artifacts);
    }

    @PostMapping("/artifacts")
    @Operation(summary = "Register Build Artifact", description = "Registers a container image or build package digest for SBOM attestation.")
    public ResponseEntity<SbomArtifactConfigResponse> registerArtifact(@Valid @RequestBody RegisterSbomArtifactRequest request) {
        SbomArtifactConfigResponse response = sbomService.registerArtifact(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/components")
    @Operation(summary = "Get All SBOM Components", description = "Retrieves open-source dependency component catalog and license compliance statuses.")
    public ResponseEntity<List<SbomComponentRecordResponse>> getAllComponents() {
        List<SbomComponentRecordResponse> components = sbomService.getAllComponents();
        return ResponseEntity.ok(components);
    }

    @PostMapping("/components/ingest")
    @Operation(summary = "Ingest SBOM Component", description = "Ingests a CycloneDX dependency component record into an artifact bill of materials.")
    public ResponseEntity<SbomComponentRecordResponse> ingestComponent(@Valid @RequestBody IngestSbomComponentRequest request) {
        SbomComponentRecordResponse response = sbomService.ingestComponent(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attest")
    @Operation(summary = "Generate Supply Chain Attestation", description = "Generates a SHA-256 certified supply chain attestation report bundle for a build artifact.")
    public ResponseEntity<SbomAttestationReportResponse> generateAttestation(@RequestParam String artifactId) {
        SbomAttestationReportResponse attestation = sbomService.generateAttestation(artifactId);
        return ResponseEntity.ok(attestation);
    }
}
