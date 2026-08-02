package com.medtrack.repository;

import com.medtrack.model.EventReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for per-user event read receipts.
 */
@Repository
public interface EventReadReceiptRepository extends JpaRepository<EventReadReceipt, Long> {

    Optional<EventReadReceipt> findByEventIdAndUserId(Long eventId, Long userId);

    List<EventReadReceipt> findByUserId(Long userId);

    List<EventReadReceipt> findByEventId(Long eventId);

    @Modifying
    @Query("DELETE FROM EventReadReceipt r WHERE r.userId = :userId AND r.eventId IN :eventIds")
    void deleteByUserIdAndEventIdIn(@Param("userId") Long userId, @Param("eventIds") List<Long> eventIds);

    long countByUserIdAndEventIdIn(Long userId, List<Long> eventIds);

    @Modifying
    @Query("DELETE FROM EventReadReceipt r WHERE r.readAt < :cutoff")
    void deleteByReadAtBefore(@Param("cutoff") java.time.LocalDateTime cutoff);
}