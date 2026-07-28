package com.medtrack.auth.cspm.repository;

import com.medtrack.auth.cspm.model.CspmSecurityFinding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CspmSecurityFindingRepository extends JpaRepository<CspmSecurityFinding, Long> {
    Optional<CspmSecurityFinding> findByFindingId(String findingId);
    List<CspmSecurityFinding> findByAccountNumber(String accountNumber);
    List<CspmSecurityFinding> findByStatus(String status);
    List<CspmSecurityFinding> findBySeverity(String severity);
}
