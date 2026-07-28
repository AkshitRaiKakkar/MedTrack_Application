package com.medtrack.auth.microsegmentation.repository;

import com.medtrack.auth.microsegmentation.model.SdpTunnelSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SdpTunnelSessionRepository extends JpaRepository<SdpTunnelSession, Long> {
    Optional<SdpTunnelSession> findBySessionId(String sessionId);
    List<SdpTunnelSession> findByUserEmail(String userEmail);
    List<SdpTunnelSession> findByStatus(String status);
}
