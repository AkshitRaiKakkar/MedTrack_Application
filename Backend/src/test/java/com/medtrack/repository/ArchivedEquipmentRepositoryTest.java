package com.medtrack.repository;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the archive side of soft delete: the queries that exist specifically to find rows where
 * {@code deleted = true}.
 *
 * <p>{@link Equipment} carries a class-level {@code @SQLRestriction("deleted = false")}. Hibernate
 * appends that predicate to <em>every</em> HQL and criteria query for the entity, including the
 * derived queries whose whole purpose is to select archived rows. The two predicates are mutually
 * exclusive, so {@code findByIdAndDeletedTrue} and {@code findByDeletedTrueAndHospitalId} could
 * never return a row - archiving an asset removed it permanently, with no way to list it or restore
 * it.</p>
 *
 * <p>The archive queries are therefore native, which bypasses the restriction. These tests pin that:
 * the default view must still hide archived rows, and the archive view must still find them.</p>
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        // A private in-memory database. The default URL names a shared instance
        // (jdbc:h2:mem:medtrackdb;DB_CLOSE_DELAY=-1) that every @SpringBootTest context connects to,
        // so the hospitals and users these tests create would otherwise outlive them from the point
        // of view of a differently-configured context - and AuthControllerIntegrationTest's
        // userRepository.deleteAll() would hit a referential integrity violation against them.
        "spring.datasource.url=jdbc:h2:mem:archive-repo-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("archived equipment queries")
class ArchivedEquipmentRepositoryTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private Hospital hospital;
    private Hospital otherHospital;

    @BeforeEach
    void setUp() {
        hospital = newHospital("Archive Test Trust");
        otherHospital = newHospital("Rival Trust");
    }

    private Hospital newHospital(String name) {
        User owner = userRepository.save(User.builder()
                .name(name + " Admin")
                .username("owner-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0000")
                .organization(name)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        return hospitalRepository.save(Hospital.builder()
                .name(name)
                .location("Test City")
                .user(owner)
                .build());
    }

    private Equipment saveEquipment(Hospital owner, String code, boolean archived) {
        Equipment equipment = Equipment.builder()
                .equipmentCode(code)
                .name("Asset " + code)
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(owner)
                .deleted(archived)
                .deletedAt(archived ? LocalDateTime.now() : null)
                .deletedBy(archived ? "admin" : null)
                .build();
        return equipmentRepository.saveAndFlush(equipment);
    }

    @Test
    @DisplayName("an archived asset can still be found by id")
    void archivedAssetIsFoundById() {
        Equipment archived = saveEquipment(hospital, "EQ-ARCH-1", true);

        Optional<Equipment> found = equipmentRepository.findByIdAndDeletedTrue(archived.getId());

        assertTrue(found.isPresent(),
                "archiving must not make the row unreachable; without this, restore and permanent "
                        + "delete can never resolve their target and the asset is lost for good");
        assertEquals("EQ-ARCH-1", found.get().getEquipmentCode());
    }

    @Test
    @DisplayName("a live asset is not returned by the archive lookup")
    void liveAssetIsNotFoundByArchiveLookup() {
        Equipment live = saveEquipment(hospital, "EQ-LIVE-1", false);

        assertTrue(equipmentRepository.findByIdAndDeletedTrue(live.getId()).isEmpty(),
                "the archive lookup must not resolve a live asset, or restore/permanent-delete "
                        + "would operate on records that were never archived");
    }

    @Test
    @DisplayName("the archive listing returns the hospital's archived assets")
    void archiveListingReturnsArchivedAssets() {
        saveEquipment(hospital, "EQ-ARCH-2", true);
        saveEquipment(hospital, "EQ-ARCH-3", true);
        saveEquipment(hospital, "EQ-LIVE-2", false);

        Page<Equipment> archived = equipmentRepository.findByDeletedTrueAndHospitalId(
                hospital.getId(), PageRequest.of(0, 10));

        assertEquals(2, archived.getTotalElements(),
                "both archived assets must be listed, and the live one must not be");
        assertTrue(archived.getContent().stream().allMatch(Equipment::getDeleted));
    }

    @Test
    @DisplayName("the archive listing is scoped to one hospital")
    void archiveListingIsTenantScoped() {
        saveEquipment(hospital, "EQ-ARCH-4", true);
        saveEquipment(otherHospital, "EQ-ARCH-5", true);

        Page<Equipment> archived = equipmentRepository.findByDeletedTrueAndHospitalId(
                hospital.getId(), PageRequest.of(0, 10));

        assertEquals(1, archived.getTotalElements());
        assertEquals("EQ-ARCH-4", archived.getContent().get(0).getEquipmentCode(),
                "the archive view must not leak another hospital's records");
    }

    @Test
    @DisplayName("archived assets stay out of the ordinary inventory views")
    void archivedAssetsAreHiddenFromNormalQueries() {
        saveEquipment(hospital, "EQ-LIVE-3", false);
        saveEquipment(hospital, "EQ-ARCH-6", true);

        // The whole point of the class-level restriction: making the archive reachable must not
        // make archived rows reappear in the inventory the hospital works with day to day.
        assertEquals(1, equipmentRepository.findByHospitalId(hospital.getId()).size(),
                "the default listing must still hide archived assets");
        assertEquals(1, equipmentRepository.countByHospitalId(hospital.getId()),
                "counts and dashboard tiles must still exclude archived assets");
        assertFalse(equipmentRepository.findByEquipmentCode("EQ-ARCH-6").isPresent(),
                "an archived code must not block re-use through the ordinary lookup");
    }
}
