package com.medtrack.repository;

import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.SlaState;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceTaskRepository extends JpaRepository<MaintenanceTask, Long> {
    Optional<MaintenanceTask> findByTaskCode(String taskCode);

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.assigned_technician_record_id = :technicianId "
            + "AND e.hospital_id = mt.hospital_id",
            nativeQuery = true)
    List<MaintenanceTask> findByAssignedTechnicianId(
            @Param("technicianId") Long technicianId);

    // Ownership-scoped queries prevent cross-hospital and cross-technician record access.
    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId",
            nativeQuery = true)
    List<MaintenanceTask> findByHospitalId(@Param("hospitalId") Long hospitalId);

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId "
            + "AND (:status IS NULL OR mt.status = :status) "
            + "AND (:equipmentId IS NULL OR mt.equipment_id = :equipmentId) "
            + "ORDER BY mt.deadline ASC, mt.id ASC",
            countQuery = "SELECT COUNT(*) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId "
            + "AND (:status IS NULL OR mt.status = :status) "
            + "AND (:equipmentId IS NULL OR mt.equipment_id = :equipmentId)",
            nativeQuery = true)
    Page<MaintenanceTask> findByHospitalIdWithFiltersNative(
            @Param("hospitalId") Long hospitalId,
            @Param("status") String status,
            @Param("equipmentId") String equipmentId,
            Pageable pageable);

    default Page<MaintenanceTask> findByHospitalIdWithFilters(
            Long hospitalId,
            MaintenanceStatus status,
            String equipmentId,
            Pageable pageable) {
        return findByHospitalIdWithFiltersNative(
                hospitalId, status != null ? status.name() : null, equipmentId, pageable);
    }

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.id = :id AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId",
            nativeQuery = true)
    Optional<MaintenanceTask> findByIdAndHospitalId(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.id = :id AND mt.assigned_technician_record_id = :technicianId "
            + "AND e.hospital_id = mt.hospital_id",
            nativeQuery = true)
    Optional<MaintenanceTask> findByIdAndAssignedTechnicianId(
            @Param("id") Long id,
            @Param("technicianId") Long technicianId);

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.assigned_technician_record_id = :technicianId "
            + "AND e.hospital_id = mt.hospital_id "
            + "AND (:status IS NULL OR mt.status = :status) "
            + "AND (:equipmentId IS NULL OR mt.equipment_id = :equipmentId) "
            + "ORDER BY mt.deadline ASC, mt.id ASC",
            countQuery = "SELECT COUNT(*) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.assigned_technician_record_id = :technicianId "
            + "AND e.hospital_id = mt.hospital_id "
            + "AND (:status IS NULL OR mt.status = :status) "
            + "AND (:equipmentId IS NULL OR mt.equipment_id = :equipmentId)",
            nativeQuery = true)
    Page<MaintenanceTask> findByAssignedTechnicianIdWithFiltersNative(
            @Param("technicianId") Long technicianId,
            @Param("status") String status,
            @Param("equipmentId") String equipmentId,
            Pageable pageable);

    default Page<MaintenanceTask> findByAssignedTechnicianIdWithFilters(
            Long technicianId,
            MaintenanceStatus status,
            String equipmentId,
            Pageable pageable) {
        return findByAssignedTechnicianIdWithFiltersNative(
                technicianId, status != null ? status.name() : null, equipmentId, pageable);
    }

    // Serialize updates to one assigned task so completion cannot create duplicate recurrences.
    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.id = :id AND mt.assigned_technician_record_id = :technicianId "
            + "AND e.hospital_id = mt.hospital_id FOR UPDATE",
            nativeQuery = true)
    Optional<MaintenanceTask> findByIdAndAssignedTechnicianIdForUpdate(
            @Param("id") Long id,
            @Param("technicianId") Long technicianId);

    // Serialize hospital deletion with technician completion of the same task.
    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.id = :id AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId FOR UPDATE",
            nativeQuery = true)
    Optional<MaintenanceTask> findByIdAndHospitalIdForUpdate(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    // Equipment history remains hospital-scoped so it cannot leak another hospital's records.
    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE "
            + "AND mt.equipment_record_id = :equipmentId "
            + "AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId",
            nativeQuery = true)
    List<MaintenanceTask> findByEquipmentRecord_IdAndHospitalId(
            @Param("equipmentId") Long equipmentId,
            @Param("hospitalId") Long hospitalId);

    // Analytics aggregation queries
    @Query(value = "SELECT COUNT(*) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId AND mt.status = :status",
            nativeQuery = true)
    long countByHospitalIdAndStatusNative(
            @Param("hospitalId") Long hospitalId, @Param("status") String status);

    default long countByHospitalIdAndStatus(Long hospitalId, MaintenanceStatus status) {
        return countByHospitalIdAndStatusNative(hospitalId, status.name());
    }

    @Query(value = "SELECT mt.* FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId AND mt.status = :status "
            + "AND mt.completed_at IS NOT NULL AND mt.deadline IS NOT NULL",
            nativeQuery = true)
    List<MaintenanceTask> findCompletedTasksWithTimestampsNative(
            @Param("hospitalId") Long hospitalId, @Param("status") String status);

    default List<MaintenanceTask> findCompletedTasksWithTimestamps(
            Long hospitalId, MaintenanceStatus status) {
        return findCompletedTasksWithTimestampsNative(hospitalId, status.name());
    }

    @Query(value = "SELECT AVG(mt.hours_worked) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId AND mt.status = :status "
            + "AND mt.hours_worked IS NOT NULL",
            nativeQuery = true)
    Double averageHoursWorkedByHospitalIdAndStatusNative(
            @Param("hospitalId") Long hospitalId, @Param("status") String status);

    default Double averageHoursWorkedByHospitalIdAndStatus(
            Long hospitalId, MaintenanceStatus status) {
        return averageHoursWorkedByHospitalIdAndStatusNative(hospitalId, status.name());
    }

    @Query(value = "SELECT COUNT(*) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.deleted = FALSE AND mt.hospital_id = :hospitalId "
            + "AND e.hospital_id = :hospitalId AND mt.status != :status "
            + "AND mt.priority = :priority",
            nativeQuery = true)
    long countByHospitalIdAndStatusNotAndPriorityNative(
            @Param("hospitalId") Long hospitalId,
            @Param("status") String status,
            @Param("priority") String priority);

    default long countByHospitalIdAndStatusNotAndPriority(
            Long hospitalId, MaintenanceStatus status, String priority) {
        return countByHospitalIdAndStatusNotAndPriorityNative(
                hospitalId, status.name(), priority);
    }

    @Query(value = "SELECT COUNT(*) FROM maintenance_tasks mt "
            + "JOIN equipment e ON e.id = mt.equipment_record_id "
            + "WHERE mt.id = :taskId AND mt.deleted = FALSE "
            + "AND mt.hospital_id = :hospitalId AND e.hospital_id = :hospitalId",
            nativeQuery = true)
    long countValidOwnership(
            @Param("taskId") Long taskId,
            @Param("hospitalId") Long hospitalId);

    @Query(value = "SELECT COUNT(*) FROM equipment e "
            + "WHERE e.id = :equipmentId AND e.hospital_id = :hospitalId "
            + "AND e.deleted = FALSE AND e.status NOT IN ('RETIRED', 'DISPOSED')",
            nativeQuery = true)
    long countSchedulableEquipment(
            @Param("equipmentId") Long equipmentId,
            @Param("hospitalId") Long hospitalId);

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
