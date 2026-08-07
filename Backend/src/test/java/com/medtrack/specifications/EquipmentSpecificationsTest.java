package com.medtrack.specifications;

import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Sort;
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
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises {@link EquipmentSpecifications} against a real database rather than a mock.
 *
 * <p>Specifications compile to SQL, so a mocked repository would assert nothing about whether the
 * generated predicates are correct. The {@code LIKE}-escaping and case-folding behaviour in
 * particular only shows up once a database actually evaluates the pattern.</p>
 *
 * <p>Follows the hand-rolled embedded-database configuration used by
 * {@code MaintenanceTaskRepositoryTest} rather than {@code @DataJpaTest}, so the test does not
 * pull in Flyway, security or the {@code JWT_SECRET} requirement.</p>
 */
@SpringJUnitConfig(EquipmentSpecificationsTest.SpecificationTestConfiguration.class)
@Transactional
@DisplayName("EquipmentSpecifications")
class EquipmentSpecificationsTest {

    private static final Sort BY_NAME = Sort.by(Sort.Direction.ASC, "name");

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private EquipmentRepository equipmentRepository;

    private Hospital ownHospital;

    @BeforeEach
    void seed() {
        ownHospital = persistHospital("City General", "Bengaluru");
        Hospital otherHospital = persistHospital("Rival Trust", "Chennai");

        persistEquipment(ownHospital, "EQ-1", "MRI Scanner X100", "Siemens Magnetom",
                "SN-100", "Radiology", EquipmentCategory.IMAGING, EquipmentStatus.ACTIVE);
        persistEquipment(ownHospital, "EQ-2", "Portable Ventilator", "Philips V60",
                "SN-200", "ICU", EquipmentCategory.RESPIRATORY, EquipmentStatus.UNDER_MAINTENANCE);
        persistEquipment(ownHospital, "EQ-3", "Patient Monitor", "Philips MX450",
                "SN-300", "icu", EquipmentCategory.MONITORING, EquipmentStatus.ACTIVE);
        persistEquipment(ownHospital, "EQ-4", "Infusion Pump 50%", "Braun_Space",
                "SN-400", "Theatre", EquipmentCategory.OTHER, EquipmentStatus.RETIRED);

        // Belongs to a different tenant and must never appear in any result below. Deliberately
        // identical to EQ-1 in name, model and department so tenant scoping is the only thing
        // that can exclude it.
        persistEquipment(otherHospital, "EQ-9", "MRI Scanner X100", "Siemens Magnetom",
                "SN-900", "Radiology", EquipmentCategory.IMAGING, EquipmentStatus.ACTIVE);

        entityManager.flush();
    }

    private Hospital persistHospital(String name, String location) {
        Hospital hospital = Hospital.builder().name(name).location(location).build();
        entityManager.persist(hospital);
        return hospital;
    }

    private void persistEquipment(Hospital hospital, String code, String name, String model,
                                  String serial, String department,
                                  EquipmentCategory category, EquipmentStatus status) {
        entityManager.persist(Equipment.builder()
                .equipmentCode(code)
                .name(name)
                .model(model)
                .serialNumber(serial)
                .department(department)
                .category(category)
                .status(status)
                .hospital(hospital)
                .build());
    }

    private List<Equipment> filter(String department, EquipmentCategory category,
                                   EquipmentStatus status, String model) {
        return equipmentRepository.findAll(
                EquipmentSpecifications.filterEquipment(
                        ownHospital.getId(), department, category, status, model),
                BY_NAME);
    }

    private List<Equipment> search(String keyword) {
        return equipmentRepository.findAll(
                EquipmentSpecifications.keywordMatches(ownHospital.getId(), keyword), BY_NAME);
    }

    private static List<String> codes(List<Equipment> results) {
        return results.stream().map(Equipment::getEquipmentCode).toList();
    }

    // -----------------------------------------------------------------
    // tenant scoping
    // -----------------------------------------------------------------

    @Test
    @DisplayName("no filters returns only the caller's inventory")
    void noFiltersReturnsOwnInventoryOnly() {
        List<Equipment> results = filter(null, null, null, null);

        assertEquals(4, results.size());
        assertTrue(results.stream()
                .allMatch(equipment -> equipment.getHospital().getId().equals(ownHospital.getId())));
    }

    @Test
    @DisplayName("search never crosses the tenant boundary, even for an identical asset")
    void searchIsTenantScoped() {
        assertEquals(List.of("EQ-1"), codes(search("MRI Scanner")));
    }

    @Test
    @DisplayName("filtering never crosses the tenant boundary")
    void filterIsTenantScoped() {
        assertEquals(List.of("EQ-1"),
                codes(filter("Radiology", EquipmentCategory.IMAGING, EquipmentStatus.ACTIVE, "Siemens")));
    }

    // -----------------------------------------------------------------
    // individual filters
    // -----------------------------------------------------------------

    @Test
    @DisplayName("department matching is case-insensitive")
    void departmentIsCaseInsensitive() {
        // EQ-2 stores "ICU" and EQ-3 stores "icu". Both must match either spelling so that /filter
        // agrees with /department, which uses findByHospitalIdAndDepartmentIgnoreCase.
        assertEquals(List.of("EQ-3", "EQ-2"), codes(filter("ICU", null, null, null)));
        assertEquals(List.of("EQ-3", "EQ-2"), codes(filter("icu", null, null, null)));
        assertEquals(List.of("EQ-3", "EQ-2"), codes(filter("  IcU  ", null, null, null)));
    }

    @Test
    @DisplayName("category filter")
    void filtersByCategory() {
        assertEquals(List.of("EQ-2"), codes(filter(null, EquipmentCategory.RESPIRATORY, null, null)));
    }

    @Test
    @DisplayName("status filter")
    void filtersByStatus() {
        assertEquals(List.of("EQ-4"), codes(filter(null, null, EquipmentStatus.RETIRED, null)));
    }

    @Test
    @DisplayName("model filter is a case-insensitive substring match")
    void filtersByModelSubstring() {
        assertEquals(List.of("EQ-3", "EQ-2"), codes(filter(null, null, null, "philips")));
        assertEquals(List.of("EQ-3", "EQ-2"), codes(filter(null, null, null, "PHILIPS")));
        assertEquals(List.of("EQ-3"), codes(filter(null, null, null, "MX450")));
    }

    @Test
    @DisplayName("blank filters are ignored rather than matched against null")
    void blankFiltersAreIgnored() {
        assertEquals(4, filter("   ", null, null, "").size());
    }

    @Test
    @DisplayName("filters combine with AND")
    void filtersCombineWithAnd() {
        assertEquals(List.of("EQ-2"), codes(filter(
                "ICU", EquipmentCategory.RESPIRATORY, EquipmentStatus.UNDER_MAINTENANCE, "Philips")));

        // Same filters, but a status no ICU respiratory asset has.
        assertTrue(filter("ICU", EquipmentCategory.RESPIRATORY, EquipmentStatus.RETIRED, "Philips")
                .isEmpty());
    }

    // -----------------------------------------------------------------
    // keyword search
    // -----------------------------------------------------------------

    @Test
    @DisplayName("keyword matches across name, model, serial, code and department")
    void keywordMatchesEveryIdentifyingField() {
        assertEquals(List.of("EQ-3"), codes(search("Patient Monitor")), "name");
        assertEquals(List.of("EQ-1"), codes(search("Magnetom")), "model");
        assertEquals(List.of("EQ-4"), codes(search("SN-400")), "serial number");
        assertEquals(List.of("EQ-1"), codes(search("EQ-1")), "equipment code");
        assertEquals(List.of("EQ-1"), codes(search("radiology")), "department");
    }

    @Test
    @DisplayName("keyword matching is case-insensitive")
    void keywordIsCaseInsensitive() {
        assertEquals(codes(search("mri scanner")), codes(search("MRI SCANNER")));
    }

    // -----------------------------------------------------------------
    // LIKE metacharacter escaping
    // -----------------------------------------------------------------

    @Test
    @DisplayName("a percent sign is a literal, not a wildcard")
    void percentIsLiteral() {
        // Unescaped this becomes LIKE '%%%', which matches the entire inventory.
        assertEquals(List.of("EQ-4"), codes(search("%")),
                "only the asset actually named 'Infusion Pump 50%' should match");
    }

    @Test
    @DisplayName("an underscore is a literal, not a single-character wildcard")
    void underscoreIsLiteral() {
        // EQ-4's model is "Braun_Space".
        assertEquals(List.of("EQ-4"), codes(search("Braun_Space")));

        // A pattern that could only match through the wildcard interpretation must find nothing.
        assertTrue(search("Braun_pace").isEmpty(),
                "underscore must not stand in for the missing 'S'");
    }

    @Test
    @DisplayName("escapeLike neutralises metacharacters and the escape character itself")
    void escapeLikeIsCorrect() {
        assertEquals("plain", EquipmentSpecifications.escapeLike("plain"));
        assertEquals("50!%", EquipmentSpecifications.escapeLike("50%"));
        assertEquals("a!_b", EquipmentSpecifications.escapeLike("a_b"));
        assertEquals("!!", EquipmentSpecifications.escapeLike("!"),
                "the escape character must itself be escaped, or escaping introduces metacharacters");
        assertEquals("!!!%", EquipmentSpecifications.escapeLike("!%"));
    }

    @Test
    @DisplayName("a blank keyword degrades to the tenant predicate alone")
    void blankKeywordReturnsTenantScopeOnly() {
        // EquipmentService rejects blank keywords before reaching the specification. This records
        // that even if it is reached, it still cannot leak across tenants.
        assertEquals(4, equipmentRepository.findAll(
                EquipmentSpecifications.keywordMatches(ownHospital.getId(), "  "), BY_NAME).size());
    }

    @Configuration
    @EnableTransactionManagement
    // Only EquipmentRepository is wanted. Scanning the whole com.medtrack.repository package also
    // picks up EquipmentOrderRepository, whose @Query references ShipmentTracking from
    // com.medtrack.supplier.model - a package this lightweight context does not map - so the
    // context fails to start with "Query validation failed".
    @EnableJpaRepositories(
            basePackageClasses = EquipmentRepository.class,
            excludeFilters = @ComponentScan.Filter(
                    type = FilterType.ASSIGNABLE_TYPE,
                    classes = {
                            EquipmentOrderRepository.class,
                            MaintenanceTaskRepository.class
                    }))
    static class SpecificationTestConfiguration {

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
