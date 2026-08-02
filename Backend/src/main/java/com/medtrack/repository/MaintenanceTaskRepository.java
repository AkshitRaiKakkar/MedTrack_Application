package com.medtrack.repository;

import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.SlaState;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceTaskRepository extends JpaRepository<MaintenanceTask, Long> {
    Optional<MaintenanceTask> findByTaskCode(String taskCode);

    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.assignedTechnicianRecord.id = :technicianId "
            + "AND task.equipmentRecord.hospital.id = task.hospitalId")
    List<MaintenanceTask> findByAssignedTechnicianId(
            @Param("technicianId") Long technicianId);

    // Ownership-scoped queries prevent cross-hospital and cross-technician record access.
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId")
    List<MaintenanceTask> findByHospitalId(@Param("hospitalId") Long hospitalId);

    @Query(value = "SELECT task FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND (:status IS NULL OR task.status = :status) "
            + "AND (:equipmentId IS NULL OR task.equipmentId = :equipmentId)",
            countQuery = "SELECT COUNT(task) FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND (:status IS NULL OR task.status = :status) "
            + "AND (:equipmentId IS NULL OR task.equipmentId = :equipmentId)")
    Page<MaintenanceTask> findByHospitalIdWithFilters(
            @Param("hospitalId") Long hospitalId,
            @Param("status") MaintenanceStatus status,
            @Param("equipmentId") String equipmentId,
            Pageable pageable);

    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.id = :id AND task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId")
    Optional<MaintenanceTask> findByIdAndHospitalId(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.id = :id AND task.assignedTechnicianRecord.id = :technicianId "
            + "AND task.equipmentRecord.hospital.id = task.hospitalId")
    Optional<MaintenanceTask> findByIdAndAssignedTechnicianId(
            @Param("id") Long id,
            @Param("technicianId") Long technicianId);

    @Query(value = "SELECT task FROM MaintenanceTask task "
            + "WHERE task.assignedTechnicianRecord.id = :technicianId "
            + "AND task.equipmentRecord.hospital.id = task.hospitalId "
            + "AND (:status IS NULL OR task.status = :status) "
            + "AND (:equipmentId IS NULL OR task.equipmentId = :equipmentId)",
            countQuery = "SELECT COUNT(task) FROM MaintenanceTask task "
            + "WHERE task.assignedTechnicianRecord.id = :technicianId "
            + "AND task.equipmentRecord.hospital.id = task.hospitalId "
            + "AND (:status IS NULL OR task.status = :status) "
            + "AND (:equipmentId IS NULL OR task.equipmentId = :equipmentId)")
    Page<MaintenanceTask> findByAssignedTechnicianIdWithFilters(
            @Param("technicianId") Long technicianId,
            @Param("status") MaintenanceStatus status,
            @Param("equipmentId") String equipmentId,
            Pageable pageable);

    // Serialize updates to one assigned task so completion cannot create duplicate recurrences.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.id = :id AND task.assignedTechnicianRecord.id = :technicianId "
            + "AND task.equipmentRecord.hospital.id = task.hospitalId")
    Optional<MaintenanceTask> findByIdAndAssignedTechnicianIdForUpdate(
            @Param("id") Long id,
            @Param("technicianId") Long technicianId);

    // Serialize hospital deletion with technician completion of the same task.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.id = :id AND task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId")
    Optional<MaintenanceTask> findByIdAndHospitalIdForUpdate(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    // Equipment history remains hospital-scoped so it cannot leak another hospital's records.
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.equipmentRecord.id = :equipmentId "
            + "AND task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId")
    List<MaintenanceTask> findByEquipmentRecord_IdAndHospitalId(
            @Param("equipmentId") Long equipmentId,
            @Param("hospitalId") Long hospitalId);

    // Analytics aggregation queries
    @Query("SELECT COUNT(t) FROM MaintenanceTask t "
            + "WHERE t.hospitalId = :hospitalId "
            + "AND t.equipmentRecord.hospital.id = :hospitalId "
            + "AND t.status = :status")
    long countByHospitalIdAndStatus(@Param("hospitalId") Long hospitalId, @Param("status") MaintenanceStatus status);

    @Query("SELECT t FROM MaintenanceTask t "
            + "WHERE t.hospitalId = :hospitalId "
            + "AND t.equipmentRecord.hospital.id = :hospitalId "
            + "AND t.status = :status "
            + "AND t.completedAt IS NOT NULL "
            + "AND t.deadline IS NOT NULL")
    List<MaintenanceTask> findCompletedTasksWithTimestamps(@Param("hospitalId") Long hospitalId, @Param("status") MaintenanceStatus status);

    @Query("SELECT AVG(t.hoursWorked) FROM MaintenanceTask t "
            + "WHERE t.hospitalId = :hospitalId "
            + "AND t.equipmentRecord.hospital.id = :hospitalId "
            + "AND t.status = :status "
            + "AND t.hoursWorked IS NOT NULL")
    Double averageHoursWorkedByHospitalIdAndStatus(@Param("hospitalId") Long hospitalId, @Param("status") MaintenanceStatus status);

    @Query("SELECT COUNT(t) FROM MaintenanceTask t "
            + "WHERE t.hospitalId = :hospitalId "
            + "AND t.equipmentRecord.hospital.id = :hospitalId "
            + "AND t.status != :status "
            + "AND t.priority = :priority")
    long countByHospitalIdAndStatusNotAndPriority(@Param("hospitalId") Long hospitalId, @Param("status") MaintenanceStatus status, @Param("priority") String priority);

    // ---------------------------------------------------------------------
    // Preventive-maintenance automation queries
    // ---------------------------------------------------------------------

    // Idempotency: a rule must not generate a second task for the same equipment in the same window.
    @Query("SELECT COUNT(task) FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND task.policyRuleId = :ruleId "
            + "AND task.equipmentRecord.id = :equipmentRecordId "
            + "AND task.deadline >= :windowStart "
            + "AND task.deadline <= :windowEnd")
    long countByRuleAndEquipmentInWindow(
            @Param("hospitalId") Long hospitalId,
            @Param("ruleId") Long ruleId,
            @Param("equipmentRecordId") Long equipmentRecordId,
            @Param("windowStart") java.time.LocalDate windowStart,
            @Param("windowEnd") java.time.LocalDate windowEnd);
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND task.slaState = :slaState "
            + "AND task.status <> :status "
            + "ORDER BY task.deadline ASC")
    List<MaintenanceTask> findByHospitalIdAndSlaStateAndStatusNot(
            @Param("hospitalId") Long hospitalId,
            @Param("slaState") SlaState slaState,
            @Param("status") MaintenanceStatus status);

    @Query("SELECT COUNT(task) FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND task.slaState = :slaState "
            + "AND task.status <> :status")
    long countByHospitalIdAndSlaStateAndStatusNot(
            @Param("hospitalId") Long hospitalId,
            @Param("slaState") SlaState slaState,
            @Param("status") MaintenanceStatus status);

    // Technician workload: open tasks grouped by the assigned technician identity.
    @Query("SELECT task.assignedTechnicianRecord.id, task.assignedTechnician, COUNT(task) "
            + "FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND task.status <> :status "
            + "AND task.assignedTechnicianRecord IS NOT NULL "
            + "GROUP BY task.assignedTechnicianRecord.id, task.assignedTechnician "
            + "ORDER BY COUNT(task) ASC")
    List<Object[]> findOpenWorkloadByTechnician(
            @Param("hospitalId") Long hospitalId,
            @Param("status") MaintenanceStatus status);

    // Open, unassigned high-priority tasks that are candidates for workload-aware assignment.
    @Query("SELECT task FROM MaintenanceTask task "
            + "WHERE task.hospitalId = :hospitalId "
            + "AND task.equipmentRecord.hospital.id = :hospitalId "
            + "AND task.status <> :status "
            + "AND task.assignedTechnicianRecord IS NULL "
            + "AND task.priority IN :priorities "
            + "ORDER BY CASE task.priority WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 ELSE 2 END, task.deadline ASC")
    List<MaintenanceTask> findUnassignedByPriority(
            @Param("hospitalId") Long hospitalId,
            @Param("status") MaintenanceStatus status,
            @Param("priorities") List<String> priorities);

}
