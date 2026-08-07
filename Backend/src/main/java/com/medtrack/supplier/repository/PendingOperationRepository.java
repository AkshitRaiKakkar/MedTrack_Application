package com.medtrack.supplier.repository;

import com.medtrack.supplier.model.PendingOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PendingOperationRepository extends JpaRepository<PendingOperation, Long> {

    @Query("SELECT p FROM PendingOperation p WHERE p.status = 'PENDING' AND p.nextRetryAt <= :currentTime AND p.retryCount < :maxRetries ORDER BY p.nextRetryAt ASC")
    List<PendingOperation> findEligibleForRecovery(@Param("currentTime") LocalDateTime currentTime,
            @Param("maxRetries") int maxRetries);

    Optional<PendingOperation> findByTargetIdAndOperationTypeAndStatus(Long targetId, String operationType,
            String status);
}
