package com.medtrack.repository;

import com.medtrack.model.MaintenanceTaskActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceTaskActivityRepository extends JpaRepository<MaintenanceTaskActivity, Long> {
    @Query("SELECT COALESCE(MAX(activity.sequenceNumber), 0) "
            + "FROM MaintenanceTaskActivity activity WHERE activity.task.id = :taskId")
    long findLastSequenceNumber(@Param("taskId") Long taskId);

    @Query(value = "SELECT activity.* FROM maintenance_task_activities activity "
            + "JOIN maintenance_tasks task ON task.id = activity.task_id "
            + "JOIN equipment e ON e.id = task.equipment_record_id "
            + "WHERE activity.task_id = :taskId AND activity.hospital_id = :hospitalId "
            + "AND task.hospital_id = :hospitalId AND e.hospital_id = :hospitalId "
            + "AND (:eventType IS NULL OR activity.event_type = :eventType) "
            + "ORDER BY activity.sequence_number DESC",
            countQuery = "SELECT COUNT(*) FROM maintenance_task_activities activity "
            + "JOIN maintenance_tasks task ON task.id = activity.task_id "
            + "JOIN equipment e ON e.id = task.equipment_record_id "
            + "WHERE activity.task_id = :taskId AND activity.hospital_id = :hospitalId "
            + "AND task.hospital_id = :hospitalId AND e.hospital_id = :hospitalId "
            + "AND (:eventType IS NULL OR activity.event_type = :eventType)",
            nativeQuery = true)
    Page<MaintenanceTaskActivity> findOwnedHistory(
            @Param("taskId") Long taskId,
            @Param("hospitalId") Long hospitalId,
            @Param("eventType") String eventType,
            Pageable pageable);
}
