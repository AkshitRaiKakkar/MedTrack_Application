package com.medtrack.auth.pam.repository;

import com.medtrack.auth.pam.model.PamAccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PamAccessRequestRepository extends JpaRepository<PamAccessRequest, Long> {
    Optional<PamAccessRequest> findByRequestId(String requestId);
    List<PamAccessRequest> findByRequesterEmail(String requesterEmail);
    List<PamAccessRequest> findByStatus(String status);
}
