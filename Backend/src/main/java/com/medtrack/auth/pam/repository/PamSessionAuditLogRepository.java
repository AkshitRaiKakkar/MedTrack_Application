package com.medtrack.auth.pam.repository;

import com.medtrack.auth.pam.model.PamSessionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PamSessionAuditLogRepository extends JpaRepository<PamSessionAuditLog, Long> {
    Optional<PamSessionAuditLog> findBySessionId(String sessionId);
    List<PamSessionAuditLog> findByRequestId(String requestId);
    List<PamSessionAuditLog> findByOperatorEmail(String operatorEmail);
}
