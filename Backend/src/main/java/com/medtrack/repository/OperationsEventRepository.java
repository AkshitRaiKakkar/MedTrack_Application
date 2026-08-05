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
     */
    Page<OperationsEvent> findByHospitalIdAndReadFalseOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);

    /**
     * Find unread events for a hospital with category filter.
     */
    Page<OperationsEvent> findByHospitalIdAndCategoryAndReadFalseOrderByCreatedAtDesc(
            Long hospitalId, OperationsEvent.EventCategory category, Pageable pageable);

    /**
     * Find events since a given timestamp (for replay/recovery).
     */
    @Query("SELECT e FROM OperationsEvent e WHERE e.hospitalId = :hospitalId AND e.createdAt > :since ORDER BY e.createdAt ASC")
    List<OperationsEvent> findByHospitalIdAndCreatedAtAfterOrderByCreatedAtAsc(
            @Param("hospitalId") Long hospitalId,
            @Param("since") LocalDateTime since);

    /**
     * Count unread events for a hospital.
     */
    long countByHospitalIdAndReadFalse(Long hospitalId);

    /**
     * Count unread events for a hospital by category.
     */
    long countByHospitalIdAndCategoryAndReadFalse(Long hospitalId, OperationsEvent.EventCategory category);

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