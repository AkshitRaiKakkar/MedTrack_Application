package com.medtrack.auth.threatintel.repository;

import com.medtrack.auth.threatintel.model.ThreatMitigationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThreatMitigationLogRepository extends JpaRepository<ThreatMitigationLog, Long> {
    Optional<ThreatMitigationLog> findByMitigationId(String mitigationId);
    List<ThreatMitigationLog> findByIndicatorValue(String indicatorValue);
}
