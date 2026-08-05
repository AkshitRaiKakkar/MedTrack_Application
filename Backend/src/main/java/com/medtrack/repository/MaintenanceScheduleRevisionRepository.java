package com.medtrack.repository;

import com.medtrack.model.MaintenanceScheduleRevision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceScheduleRevisionRepository
        extends JpaRepository<MaintenanceScheduleRevision, Long> {

    @Query(value = "SELECT revision.* FROM maintenance_schedule_revisions revision "
            + "JOIN maintenance_tasks task ON task.id = revision.task_id "
            + "JOIN equipment e ON e.id = task.equipment_record_id "
            + "WHERE revision.task_id = :taskId "
            + "AND revision.hospital_id = :hospitalId "
            + "AND task.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId "
            + "ORDER BY revision.revision_number DESC",
            countQuery = "SELECT COUNT(*) FROM maintenance_schedule_revisions revision "
            + "JOIN maintenance_tasks task ON task.id = revision.task_id "
            + "JOIN equipment e ON e.id = task.equipment_record_id "
            + "WHERE revision.task_id = :taskId "
            + "AND revision.hospital_id = :hospitalId "
            + "AND task.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId",
            nativeQuery = true)
    Page<MaintenanceScheduleRevision> findOwnedRevisions(
            @Param("taskId") Long taskId,
            @Param("hospitalId") Long hospitalId,
            Pageable pageable);
}
