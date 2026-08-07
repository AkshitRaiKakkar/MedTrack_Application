package com.medtrack.auth.soar.repository;

import com.medtrack.auth.soar.model.SoarPlaybookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoarPlaybookConfigRepository extends JpaRepository<SoarPlaybookConfig, Long> {
    Optional<SoarPlaybookConfig> findByPlaybookId(String playbookId);
    List<SoarPlaybookConfig> findByStatus(String status);
}
