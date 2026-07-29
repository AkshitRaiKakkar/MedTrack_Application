package com.medtrack.auth.sbom.repository;

import com.medtrack.auth.sbom.model.SbomComponentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SbomComponentRecordRepository extends JpaRepository<SbomComponentRecord, Long> {
    Optional<SbomComponentRecord> findByComponentId(String componentId);
    List<SbomComponentRecord> findByArtifactId(String artifactId);
    List<SbomComponentRecord> findByRiskLevel(String riskLevel);
}
