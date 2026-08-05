package com.medtrack.repository;

import com.medtrack.model.OperationsEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Repository for operations events.
 * Supports hospital-scoped queries with filtering by category, type, severity, and read status.
 */
@Repository
public interface OperationsEventRepository extends JpaRepository<OperationsEvent, Long> {

    /**
     * Find events for a hospital, ordered by createdAt desc.
     */
    Page<OperationsEvent> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);

    /**
     * Find events for a hospital with category filter.
     */
    Page<OperationsEvent> findByHospitalIdAndCategoryOrderByCreatedAtDesc(
            Long hospitalId, OperationsEvent.EventCategory category, Pageable pageable);

    /**
     * Find events for a hospital with category and type filters.
     */
    Page<OperationsEvent> findByHospitalIdAndCategoryAndTypeOrderByCreatedAtDesc(
            Long hospitalId, OperationsEvent.EventCategory category, OperationsEvent.EventType type, Pageable pageable);

    /**
     * Find unread events for a hospital.
     *
     * <p>Unread is determined per-user via {@code event_read_receipts}, not the shared
     * {@code read} column on {@code OperationsEvent} (that column is never mutated after
     * insert and cannot represent "read by this user" once more than one user shares a
     * hospital account).</p>
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId "
            + "AND NOT EXISTS (SELECT 1 FROM EventReadReceipt r WHERE r.eventId = e.id AND r.userId = :userId) "
            + "ORDER BY e.createdAt DESC")
    Page<OperationsEvent> findUnreadForUser(
            @Param("hospitalId") Long hospitalId, @Param("userId") Long userId, Pageable pageable);

    /**
     * Find unread events for a hospital with category filter, per-user (see {@link #findUnreadForUser}).
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId AND e.category = :category "
            + "AND NOT EXISTS (SELECT 1 FROM EventReadReceipt r WHERE r.eventId = e.id AND r.userId = :userId) "
            + "ORDER BY e.createdAt DESC")
    Page<OperationsEvent> findUnreadForUserByCategory(
            @Param("hospitalId") Long hospitalId,
            @Param("category") OperationsEvent.EventCategory category,
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Count unread events for a hospital and category, per-user (see {@link #findUnreadForUser}).
     */
    @Query("SELECT COUNT(e) FROM OperationsEvent e WHERE e.hospitalId = :hospitalId AND e.category = :category "
            + "AND NOT EXISTS (SELECT 1 FROM EventReadReceipt r WHERE r.eventId = e.id AND r.userId = :userId)")
    long countUnreadForUserByCategory(
            @Param("hospitalId") Long hospitalId,
            @Param("category") OperationsEvent.EventCategory category,
            @Param("userId") Long userId);

    /**
     * Find events for a hospital, excluding one or more muted categories. Used for the
     * unfiltered "All" view once the caller has muted at least one category.
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId "
            + "AND e.category NOT IN :excludedCategories ORDER BY e.createdAt DESC")
    Page<OperationsEvent> findByHospitalIdExcludingCategories(
            @Param("hospitalId") Long hospitalId,
            @Param("excludedCategories") Set<OperationsEvent.EventCategory> excludedCategories,
            Pageable pageable);

    /**
     * Per-user unread events for a hospital, excluding muted categories (see
     * {@link #findByHospitalIdExcludingCategories} and {@link #findUnreadForUser}).
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId "
            + "AND e.category NOT IN :excludedCategories "
            + "AND NOT EXISTS (SELECT 1 FROM EventReadReceipt r WHERE r.eventId = e.id AND r.userId = :userId) "
            + "ORDER BY e.createdAt DESC")
    Page<OperationsEvent> findUnreadForUserExcludingCategories(
            @Param("hospitalId") Long hospitalId,
            @Param("excludedCategories") Set<OperationsEvent.EventCategory> excludedCategories,
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Find events since a given timestamp (for replay/recovery).
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId AND e.createdAt > :since ORDER BY e.createdAt ASC")
    List<OperationsEvent> findByHospitalIdAndCreatedAtAfterOrderByCreatedAtAsc(
            @Param("hospitalId") Long hospitalId,
            @Param("since") LocalDateTime since);

    /**
     * Find events by entity reference.
     */
    List<OperationsEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            OperationsEvent.EntityType entityType, Long entityId);

    /**
     * Delete old events (older than retention period).
     */
    @Query("DELETE FROM OperationsEvent e WHERE e.createdAt < :cutoff")
    void deleteByCreatedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}