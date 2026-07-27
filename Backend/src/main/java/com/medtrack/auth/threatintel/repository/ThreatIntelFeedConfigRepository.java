package com.medtrack.auth.threatintel.repository;

import com.medtrack.auth.threatintel.model.ThreatIntelFeedConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThreatIntelFeedConfigRepository extends JpaRepository<ThreatIntelFeedConfig, Long> {
    Optional<ThreatIntelFeedConfig> findByFeedName(String feedName);
}
