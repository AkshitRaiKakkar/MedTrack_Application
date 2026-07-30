package com.medtrack.auth.saml.repository;

import com.medtrack.auth.saml.model.SamlSessionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SamlSessionLogRepository extends JpaRepository<SamlSessionLog, Long> {
    Optional<SamlSessionLog> findByAssertionId(String assertionId);
    List<SamlSessionLog> findByNameId(String nameId);
    List<SamlSessionLog> findByAssertionStatus(String assertionStatus);
}
