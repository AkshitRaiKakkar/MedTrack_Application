package com.medtrack.repository;

import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringJUnitConfig(MaintenanceTaskRepositoryTest.RepositoryTestConfiguration.class)
@Transactional
class MaintenanceTaskRepositoryTest {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MaintenanceTaskRepository taskRepository;

    @Test
    void ownershipScopedQueriesRequireTaskAndEquipmentHospitalToAgree() {
        Hospital equipmentHospital = persistHospital("Equipment Hospital");
        Hospital taskHospital = persistHospital("Task Hospital");
        Equipment equipment = persistEquipment(equipmentHospital);
        MaintenanceTask inconsistentTask = persistTask(
                "MNT-INCONSISTENT", equipment, taskHospital, "tech@medtrack.com");
        MaintenanceTask validTask = persistTask(
                "MNT-VALID", equipment, equipmentHospital, "valid-tech@medtrack.com");
        entityManager.flush();
        entityManager.clear();

        assertTrue(taskRepository.findByHospitalId(taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnician("tech@medtrack.com").isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalId(
                inconsistentTask.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndAssignedTechnician(
                inconsistentTask.getId(), "tech@medtrack.com").isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalIdForUpdate(
                inconsistentTask.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByIdAndAssignedTechnicianForUpdate(
                inconsistentTask.getId(), "tech@medtrack.com").isEmpty());
        assertTrue(taskRepository.findByEquipmentRecord_IdAndHospitalId(
                equipment.getId(), taskHospital.getId()).isEmpty());
        assertTrue(taskRepository.findByHospitalIdWithFilters(
                taskHospital.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertTrue(taskRepository.findByAssignedTechnicianWithFilters(
                "tech@medtrack.com", MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());

        assertFalse(taskRepository.findByHospitalId(equipmentHospital.getId()).isEmpty());
        assertFalse(taskRepository.findByAssignedTechnician("valid-tech@medtrack.com").isEmpty());
        assertTrue(taskRepository.findByIdAndHospitalId(
                validTask.getId(), equipmentHospital.getId()).isPresent());
        assertTrue(taskRepository.findByIdAndAssignedTechnician(
                validTask.getId(), "valid-tech@medtrack.com").isPresent());
        assertFalse(taskRepository.findByHospitalIdWithFilters(
                equipmentHospital.getId(), MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
        assertFalse(taskRepository.findByAssignedTechnicianWithFilters(
                "valid-tech@medtrack.com", MaintenanceStatus.SCHEDULED,
                equipment.getEquipmentCode(), Pageable.unpaged()).isEmpty());
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

    private MaintenanceTask persistTask(
            String taskCode,
            Equipment equipment,
            Hospital hospital,
            String assignedTechnician) {
        MaintenanceTask task = MaintenanceTask.builder()
                .taskCode(taskCode)
                .equipmentId(equipment.getEquipmentCode())
                .equipment(equipment.getName())
                .equipmentRecord(equipment)
                .hospital(hospital.getName())
                .hospitalId(hospital.getId())
                .maintenanceType("Inspection")
                .deadline(LocalDate.now().plusDays(1))
                .assignedTechnician(assignedTechnician)
                .priority("Normal")
                .status(MaintenanceStatus.SCHEDULED)
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
                    "hibernate.show_sql", "false"));
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }
    }
}
