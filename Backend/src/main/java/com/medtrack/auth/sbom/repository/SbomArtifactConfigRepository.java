package com.medtrack.auth.sbom.repository;

import com.medtrack.auth.sbom.model.SbomArtifactConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SbomArtifactConfigRepository extends JpaRepository<SbomArtifactConfig, Long> {
    Optional<SbomArtifactConfig> findByArtifactId(String artifactId);
}
