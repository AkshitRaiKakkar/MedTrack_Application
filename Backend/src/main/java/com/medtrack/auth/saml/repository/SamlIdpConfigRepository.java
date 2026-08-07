package com.medtrack.auth.saml.repository;

import com.medtrack.auth.saml.model.SamlIdpConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SamlIdpConfigRepository extends JpaRepository<SamlIdpConfig, Long> {
    Optional<SamlIdpConfig> findByEntityId(String entityId);
}
