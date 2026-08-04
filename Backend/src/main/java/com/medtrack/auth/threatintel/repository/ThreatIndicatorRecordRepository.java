package com.medtrack.auth.threatintel.repository;

import com.medtrack.auth.threatintel.model.ThreatIndicatorRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThreatIndicatorRecordRepository extends JpaRepository<ThreatIndicatorRecord, Long> {
    Optional<ThreatIndicatorRecord> findByIndicatorValue(String indicatorValue);
    List<ThreatIndicatorRecord> findByStatus(String status);
    List<ThreatIndicatorRecord> findByThreatCategory(String threatCategory);
}
