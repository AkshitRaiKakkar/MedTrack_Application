package com.medtrack.auth.soar.repository;

import com.medtrack.auth.soar.model.SoarExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoarExecutionLogRepository extends JpaRepository<SoarExecutionLog, Long> {
    Optional<SoarExecutionLog> findByExecutionId(String executionId);
    List<SoarExecutionLog> findByPlaybookId(String playbookId);
    List<SoarExecutionLog> findByStatus(String status);
}
