package com.medtrack.repository;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTaskActivity;
import com.medtrack.model.MaintenanceActivityType;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceScheduleRevision;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringJUnitConfig(MaintenanceTaskRepositoryTest.RepositoryTestConfiguration.class)
@Transactional
class MaintenanceTaskRepositoryTest {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MaintenanceTaskRepository taskRepository;

    @Autowired
    private MaintenanceTaskActivityRepository activityRepository;

    @Autowired
    private MaintenanceScheduleRevisionRepository scheduleRevisionRepository;

    @Test
    void scheduleRevisionsAreOwnershipScopedNewestFirstAndSurviveTaskArchival() {
        Hospital hospital = persistHospital("revision-owner");
        User technician = persistTechnician("revision-tech");
        Equipment equipment = persistEquipment(hospital);
        MaintenanceTask task = persistTask("MNT-REVISIONS", equipment, hospital, technician);
        LocalDate initialDeadline = LocalDate.now().plusDays(2);

        MaintenanceScheduleRevision first = persistScheduleRevision(
                task, hospital, 1, initialDeadline, initialDeadline.plusDays(1),
                "deadline", "Parts delivery delayed");
        MaintenanceScheduleRevision second = persistScheduleRevision(
                task, hospital, 2, initialDeadline.plusDays(1), initialDeadline.plusDays(3),
                "deadline,priority", "Critical inspection window");
        task.setDeleted(true);
        task.setDeletedAt(LocalDateTime.now());
        entityManager.flush();
        entityManager.clear();

        Page<MaintenanceScheduleRevision> owned =
                scheduleRevisionRepository.findOwnedRevisions(
                        task.getId(), hospital.getId(), PageRequest.of(0, 10));

        assertEquals(List.of(second.getId(), first.getId()),
                owned.getContent().stream().map(MaintenanceScheduleRevision::getId).toList());
        assertTrue(scheduleRevisionRepository.findOwnedRevisions(
                task.getId(), hospital.getId() + 100, PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void scheduleRevisionQueryRejectsMismatchedTaskAndEquipmentOwnership() {
        Hospital equipmentHospital = persistHospital("revision-equipment-owner");
        Hospital inconsistentHospital = persistHospital("revision-false-owner");
        User technician = persistTechnician("revision-isolation-tech");
        Equipment equipment = persistEquipment(equipmentHospital);
        MaintenanceTask inconsistentTask = persistTask(
                "MNT-INCONSISTENT-REVISION", equipment, inconsistentHospital, technician);
        persistScheduleRevision(inconsistentTask, inconsistentHospital, 1,
                LocalDate.now().plusDays(2), LocalDate.now().plusDays(3),
                "deadline", "Attempted change");
        entityManager.flush();
        entityManager.clear();

        assertTrue(scheduleRevisionRepository.findOwnedRevisions(
                inconsistentTask.getId(), inconsistentHospital.getId(),
                PageRequest.of(0, 10)).isEmpty());
        assertTrue(scheduleRevisionRepository.findOwnedRevisions(
                inconsistentTask.getId(), equipmentHospital.getId(),
                PageRequest.of(0, 10)).isEmpty());
    }

    private MaintenanceScheduleRevision persistScheduleRevision(
            MaintenanceTask task,
            Hospital hospital,
            int revisionNumber,
            LocalDate previousDeadline,
            LocalDate newDeadline,
            String changedFields,
            String reason) {
        return scheduleRevisionRepository.save(MaintenanceScheduleRevision.builder()
                .task(task).hospitalId(hospital.getId()).revisionNumber(revisionNumber)
                .actorEmail("hospital@medtrack.com")
                .reason(reason).changedFields(changedFields)
                .previousDeadline(previousDeadline).newDeadline(newDeadline)
                .previousMaintenanceType("Inspection").newMaintenanceType("Inspection")
                .previousDescription("Original").newDescription("Updated")
                .previousPriority("Normal").newPriority(
                        changedFields.contains("priority") ? "Critical" : "Normal")
                .previousRecurrencePeriodDays(30).newRecurrencePeriodDays(30)
                .amendedAt(LocalDateTime.now()).build());
    }

    @Test
    void softDeletedTasksAreExcludedFromNormalRepositoryAccess() {
        Hospital hospital = persistHospital("Archive Hospital");
        Equipment equipment = persistEquipment(hospital);
        User technician = persistTechnician("archive-tech");
        MaintenanceTask task = persistTask("MNT-ARCHIVED", equipment, hospital, technician);
        task.setDeleted(true);
        task.setDeletedAt(LocalDateTime.now());
        task.setDeletedBy("hospital@medtrack.com");
        Long taskId = task.getId();
        entityManager.flush();
        entityManager.clear();

        assertTrue(taskRepository.findById(taskId).isEmpty());
        assertTrue(taskRepository.findByHospitalId(hospital.getId()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnicianId(technician.getId()).isEmpty());
    }

    @Test
    void archivedEquipmentDoesNotHideRetainedMaintenanceHistory() {
        Hospital hospital = persistHospital("Archived Equipment Hospital");
        Equipment equipment = persistEquipment(hospital);
        User technician = persistTechnician("archived-equipment-tech");
        MaintenanceTask task = persistTask(
                "MNT-ARCHIVED-EQUIPMENT", equipment, hospital, technician);
        Long taskId = task.getId();
        Long equipmentId = equipment.getId();

        equipment.setDeleted(true);
        equipment.setDeletedAt(LocalDateTime.now());
        equipment.setDeletedBy("hospital@medtrack.com");
        entityManager.flush();
        entityManager.clear();

        assertEquals(1, taskRepository.findByHospitalId(hospital.getId()).size());
        assertEquals(1, taskRepository.findByAssignedTechnicianId(technician.getId()).size());
        assertTrue(taskRepository.findByIdAndHospitalId(taskId, hospital.getId()).isPresent());
        assertTrue(taskRepository.findByIdAndAssignedTechnicianId(
                taskId, technician.getId()).isPresent());
        assertEquals(1, taskRepository.findByEquipmentRecord_IdAndHospitalId(
                equipmentId, hospital.getId()).size());
        assertEquals(1, taskRepository.findByHospitalIdWithFilters(
                hospital.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).getTotalElements());
        assertEquals(1, taskRepository.findByAssignedTechnicianIdWithFilters(
                technician.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).getTotalElements());
        assertEquals(1, taskRepository.countByHospitalIdAndStatus(
                hospital.getId(), MaintenanceStatus.SCHEDULED));
        assertEquals(2.0, taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                hospital.getId(), MaintenanceStatus.SCHEDULED));
        assertEquals(1, taskRepository.countByHospitalIdAndStatusNotAndPriority(
                hospital.getId(), MaintenanceStatus.COMPLETED, "Critical"));
        assertEquals(0, taskRepository.countSchedulableEquipment(
                equipmentId, hospital.getId()));
    }

    @Test
    void activityTimelineIsHospitalScopedFilteredAndNewestFirst() {
        Hospital hospital = persistHospital("timeline-owner");
        User technician = persistTechnician("timeline-tech");
        Equipment equipment = persistEquipment(hospital);
        equipment.setEquipmentCode("EQ-TIMELINE");
        MaintenanceTask task = persistTask("MNT-TIMELINE", equipment, hospital, technician);

        MaintenanceTaskActivity scheduled = persistActivity(
                task, hospital, 1L, MaintenanceActivityType.TASK_CREATED,
                LocalDateTime.of(2026, 8, 1, 9, 0));
        MaintenanceTaskActivity completed = persistActivity(
                task, hospital, 2L, MaintenanceActivityType.STATUS_CHANGED,
                LocalDateTime.of(2026, 8, 2, 9, 0));
        entityManager.flush();

        Page<MaintenanceTaskActivity> all = activityRepository.findOwnedHistory(
                task.getId(), hospital.getId(), null, PageRequest.of(0, 10));
        Page<MaintenanceTaskActivity> filtered = activityRepository.findOwnedHistory(
                task.getId(), hospital.getId(), "STATUS_CHANGED", PageRequest.of(0, 10));

        assertEquals(List.of(completed.getId(), scheduled.getId()),
                all.getContent().stream().map(MaintenanceTaskActivity::getId).toList());
        assertEquals(List.of(completed.getId()),
                filtered.getContent().stream().map(MaintenanceTaskActivity::getId).toList());
        assertTrue(activityRepository.findOwnedHistory(
                task.getId(), hospital.getId() + 999, null,
                PageRequest.of(0, 10)).isEmpty());
        assertEquals(2L, activityRepository.findLastSequenceNumber(task.getId()));
    }

    private MaintenanceTaskActivity persistActivity(
            MaintenanceTask task,
            Hospital hospital,
            long sequence,
            MaintenanceActivityType type,
            LocalDateTime occurredAt) {
        MaintenanceTaskActivity activity = MaintenanceTaskActivity.builder()
                .task(task)
                .hospitalId(hospital.getId())
                .sequenceNumber(sequence)
                .eventType(type)
                .actorEmail("system@medtrack.local")
                .actorRole("SYSTEM")
                .newStatus(MaintenanceStatus.SCHEDULED)
                .changedFields("task,status")
                .summary("Maintenance activity recorded")
                .occurredAt(occurredAt)
                .build();
        return activityRepository.save(activity);
    }

    @Test
    void recurrenceEligibilityExcludesRetiredDisposedAndArchivedEquipment() {
        Hospital hospital = persistHospital("Recurrence Eligibility Hospital");
        Equipment equipment = persistEquipment(hospital);
        entityManager.flush();

        assertEquals(1, taskRepository.countSchedulableEquipment(
                equipment.getId(), hospital.getId()));

        equipment.setStatus(EquipmentStatus.RETIRED);
        entityManager.flush();
        assertEquals(0, taskRepository.countSchedulableEquipment(
                equipment.getId(), hospital.getId()));

        equipment.setStatus(EquipmentStatus.DISPOSED);
        entityManager.flush();
        assertEquals(0, taskRepository.countSchedulableEquipment(
                equipment.getId(), hospital.getId()));

        equipment.setStatus(EquipmentStatus.ACTIVE);
        equipment.setDeleted(true);
        entityManager.flush();
        assertEquals(0, taskRepository.countSchedulableEquipment(
                equipment.getId(), hospital.getId()));
    }

    @Test
    void generatedOccurrenceHistoryIncludesSoftDeletedTasksAndEnforcesOwnership() {
        Hospital equipmentHospital = persistHospital("Generation History Hospital");
        Hospital inconsistentHospital = persistHospital("Inconsistent Generation Hospital");
        Equipment equipment = persistEquipment(equipmentHospital);
        User technician = persistTechnician("generation-history-tech");
        LocalDate firstDeadline = LocalDate.now().plusDays(7);
        LocalDate latestDeadline = LocalDate.now().plusDays(14);

        MaintenanceTask archivedOccurrence = persistTask(
                "MNT-GENERATED-ARCHIVED", equipment, equipmentHospital, technician);
        archivedOccurrence.setPolicyRuleId(77L);
        archivedOccurrence.setDeadline(firstDeadline);
        archivedOccurrence.setDeleted(true);
        archivedOccurrence.setDeletedAt(LocalDateTime.now());

        MaintenanceTask latestOccurrence = persistTask(
                "MNT-GENERATED-LATEST", equipment, equipmentHospital, technician);
        latestOccurrence.setPolicyRuleId(77L);
        latestOccurrence.setDeadline(latestDeadline);

        MaintenanceTask inconsistentOccurrence = persistTask(
                "MNT-GENERATED-INCONSISTENT", equipment, inconsistentHospital, technician);
        inconsistentOccurrence.setPolicyRuleId(77L);
        inconsistentOccurrence.setDeadline(LocalDate.now().plusDays(30));
        entityManager.flush();
        entityManager.clear();

        List<MaintenanceTaskRepository.GeneratedOccurrence> anchors =
                taskRepository.findLatestGeneratedDeadlines(equipmentHospital.getId(), 77L);
        List<MaintenanceTaskRepository.GeneratedOccurrence> inWindow =
                taskRepository.findGeneratedOccurrencesInWindow(
                        equipmentHospital.getId(),
                        77L,
                        LocalDate.now(),
                        LocalDate.now().plusDays(20));

        assertEquals(1, anchors.size());
        assertEquals(equipment.getId(), anchors.get(0).getEquipmentRecordId());
        assertEquals(latestDeadline, anchors.get(0).getDeadline());
        assertEquals(2, inWindow.size());
        assertTrue(inWindow.stream().anyMatch(item -> firstDeadline.equals(item.getDeadline())));
        assertTrue(inWindow.stream().anyMatch(item -> latestDeadline.equals(item.getDeadline())));
    }

    @Test
    void ownershipScopedQueriesRequireTaskAndEquipmentHospitalToAgree() {
        Hospital equipmentHospital = persistHospital("Equipment Hospital");
        Hospital taskHospital = persistHospital("Task Hospital");
        Equipment equipment = persistEquipment(equipmentHospital);
        User inconsistentTechnician = persistTechnician("tech");
        User validTechnician = persistTechnician("valid-tech");
        MaintenanceTask inconsistentTask = persistTask(
                "MNT-INCONSISTENT", equipment, taskHospital, inconsistentTechnician);
        MaintenanceTask validTask = persistTask(
                "MNT-VALID", equipment, equipmentHospital, validTechnician);
        MaintenanceTask inconsistentCompletedTask = persistTask(
                "MNT-INCONSISTENT-COMPLETED", equipment, taskHospital, inconsistentTechnician);
        inconsistentCompletedTask.setStatus(MaintenanceStatus.COMPLETED);
        inconsistentCompletedTask.setCompletedAt(LocalDateTime.now());
        MaintenanceTask validCompletedTask = persistTask(
                "MNT-VALID-COMPLETED", equipment, equipmentHospital, validTechnician);
        validCompletedTask.setStatus(MaintenanceStatus.COMPLETED);
        validCompletedTask.setCompletedAt(LocalDateTime.now());
        entityManager.flush();
        entityManager.clear();

        assertTrue(taskRepository.findByHospitalId(taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnicianId(inconsistentTechnician.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalId(
                inconsistentTask.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndAssignedTechnicianId(
                inconsistentTask.getId(), inconsistentTechnician.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalIdForUpdate(
                inconsistentTask.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndAssignedTechnicianIdForUpdate(
                inconsistentTask.getId(), inconsistentTechnician.getId()).isEmpty());
        assertTrue(taskRepository.findByEquipmentRecord_IdAndHospitalId(
                equipment.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByHospitalIdWithFilters(
                taskHospital.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnicianIdWithFilters(
                inconsistentTechnician.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertEquals(0, taskRepository.countByHospitalIdAndStatus(
                taskHospital.getId(), MaintenanceStatus.SCHEDULED));
        assertTrue(taskRepository.findCompletedTasksWithTimestamps(
                taskHospital.getId(), MaintenanceStatus.COMPLETED).isEmpty());
        assertNull(taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                taskHospital.getId(), MaintenanceStatus.SCHEDULED));
        assertEquals(0, taskRepository.countByHospitalIdAndStatusNotAndPriority(
                taskHospital.getId(), MaintenanceStatus.COMPLETED, "Critical"));

        assertFalse(taskRepository.findByHospitalId(equipmentHospital.getId()).isEmpty());
        assertFalse(taskRepository.findByAssignedTechnicianId(validTechnician.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalId(
                validTask.getId(), equipmentHospital.getId()).isPresent());
        assertTrue(taskRepository.findByIdAndAssignedTechnicianId(
                validTask.getId(), validTechnician.getId()).isPresent());
        assertFalse(taskRepository.findByHospitalIdWithFilters(
                equipmentHospital.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertFalse(taskRepository.findByAssignedTechnicianIdWithFilters(
                validTechnician.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertEquals(1, taskRepository.countByHospitalIdAndStatus(
                equipmentHospital.getId(), MaintenanceStatus.SCHEDULED));
        assertEquals(1, taskRepository.findCompletedTasksWithTimestamps(
                equipmentHospital.getId(), MaintenanceStatus.COMPLETED).size());
        assertEquals(2.0, taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                equipmentHospital.getId(), MaintenanceStatus.SCHEDULED));
        assertEquals(1, taskRepository.countByHospitalIdAndStatusNotAndPriority(
                equipmentHospital.getId(), MaintenanceStatus.COMPLETED, "Critical"));

        User renamedTechnician = entityManager.find(User.class, validTechnician.getId());
        renamedTechnician.setEmail("renamed-tech@medtrack.com");
        entityManager.flush();
        entityManager.clear();

        assertFalse(taskRepository.findByAssignedTechnicianId(
                validTechnician.getId()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnicianId(
                inconsistentTechnician.getId()).isEmpty());
    }

    private Hospital persistHospital(String name) {
        Hospital hospital = Hospital.builder()
                .name(name)
                .location("Test Location")
                .build();
        entityManager.persist(hospital);
        return hospital;
    }

    private Equipment persistEquipment(Hospital hospital) {
        Equipment equipment = Equipment.builder()
                .equipmentCode("EQ-OWNERSHIP")
                .name("Ownership Test Equipment")
                .department("QA")
                .hospital(hospital)
                .build();
        entityManager.persist(equipment);
        return equipment;
    }

    private User persistTechnician(String emailPrefix) {
        User technician = User.builder()
                .name("Test Technician")
                .username(emailPrefix)
                .email(emailPrefix + "@medtrack.com")
                .password("encoded-password")
                .role("technician")
                .accountStatus(AccountStatus.ACTIVE)
                .phone("0000000000")
                .organization("MedTrack")
                .build();
        entityManager.persist(technician);
        return technician;
    }

    private MaintenanceTask persistTask(
            String taskCode,
            Equipment equipment,
            Hospital hospital,
            User assignedTechnician) {
        MaintenanceTask task = MaintenanceTask.builder()
                .taskCode(taskCode)
                .equipmentId(equipment.getEquipmentCode())
                .equipment(equipment.getName())
                .equipmentRecord(equipment)
                .hospital(hospital.getName())
                .hospitalId(hospital.getId())
                .maintenanceType("Inspection")
                .deadline(LocalDate.now().plusDays(1))
                .assignedTechnician(assignedTechnician.getEmail())
                .assignedTechnicianRecord(assignedTechnician)
                .priority("Critical")
                .status(MaintenanceStatus.SCHEDULED)
                .hoursWorked(2.0)
                .build();
        entityManager.persist(task);
        return task;
    }

    @Configuration
    @EnableTransactionManagement
    @EnableJpaRepositories(
            basePackageClasses = MaintenanceTaskRepository.class,
            excludeFilters = @ComponentScan.Filter(
                    type = FilterType.ASSIGNABLE_TYPE,
                    classes = {
                            EquipmentOrderRepository.class,
                            EquipmentRepository.class,
                            HospitalRepository.class
                    }))
    static class RepositoryTestConfiguration {

        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder()
                    .setType(EmbeddedDatabaseType.H2)
                    .generateUniqueName(true)
                    .build();
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            LocalContainerEntityManagerFactoryBean factory =
                    new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan("com.medtrack.model", "com.medtrack.auth.model");
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of(
                    "hibernate.hbm2ddl.auto", "create-drop",
                    "hibernate.show_sql", "false",
                    "hibernate.physical_naming_strategy",
                    "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"));
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }
    }
}
