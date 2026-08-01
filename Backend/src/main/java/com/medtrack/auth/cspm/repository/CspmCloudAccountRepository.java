package com.medtrack.auth.cspm.repository;

import com.medtrack.auth.cspm.model.CspmCloudAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CspmCloudAccountRepository extends JpaRepository<CspmCloudAccount, Long> {
    Optional<CspmCloudAccount> findByAccountNumber(String accountNumber);
    List<CspmCloudAccount> findByProvider(String provider);
}
