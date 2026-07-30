package com.medtrack.auth.commandcenter.repository;

import com.medtrack.auth.commandcenter.model.SecurityCommandCenterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SecurityCommandCenterConfigRepository extends JpaRepository<SecurityCommandCenterConfig, Long> {
    Optional<SecurityCommandCenterConfig> findByConfigName(String configName);
}
