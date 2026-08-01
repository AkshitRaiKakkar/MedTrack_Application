package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The archive lifecycle end to end, through {@link EquipmentService} rather than the repository.
 *
 * <p>Soft delete exists so that an asset can be taken out of circulation without destroying its
 * audit trail, and brought back if it was archived by mistake. That promise only holds if an
 * archived row remains <em>findable</em>. It did not: the class-level
 * {@code @SQLRestriction("deleted = false")} on {@link Equipment} was appended to the archive
 * queries too, so archiving was a one-way door - the asset disappeared from the inventory and no
 * endpoint could reach it again.</p>
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
        "spring.datasource.url=jdbc:h2:mem:archive-service-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("equipment archive lifecycle")
class EquipmentArchiveLifecycleTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private String username;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        username = "archive-owner-" + UUID.randomUUID();

        User owner = userRepository.save(User.builder()
                .name("Archive Owner")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0001")
                .organization("Archive Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Archive Trust")
                .location("Test City")
                .user(owner)
                .build());
    }

    private Equipment liveAsset(String code) {
        return equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode(code)
                .name("Asset " + code)
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .build());
    }

    @Test
    @DisplayName("archiving hides the asset from the inventory but keeps it in the archive")
    void archivingMovesTheAssetToTheArchive() {
        Equipment asset = liveAsset("EQ-LIFE-1");

        equipmentService.archiveEquipment(asset.getId(), username);

        assertTrue(equipmentService.getAllEquipment(username).isEmpty(),
                "an archived asset must leave the working inventory");

        Page<Equipment> archived =
                equipmentService.getArchivedEquipment(username, PageRequest.of(0, 10));
        assertEquals(1, archived.getTotalElements(),
                "an archived asset must appear in the archive; if it does not, it is simply gone");
        assertEquals("EQ-LIFE-1", archived.getContent().get(0).getEquipmentCode());
        assertTrue(archived.getContent().get(0).getDeleted());
    }

    @Test
    @DisplayName("an archived asset can be restored to the inventory")
    void archivedAssetCanBeRestored() {
        Equipment asset = liveAsset("EQ-LIFE-2");
        equipmentService.archiveEquipment(asset.getId(), username);

        Equipment restored = equipmentService.restoreEquipment(asset.getId(), username);

        assertFalse(restored.getDeleted());
        assertEquals(1, equipmentService.getAllEquipment(username).size(),
                "the restored asset must be back in the working inventory");
        assertEquals(0, equipmentService.getArchivedEquipment(username, PageRequest.of(0, 10))
                .getTotalElements(),
                "and it must no longer be listed as archived");
    }

    @Test
    @DisplayName("restore records who archived it and when, then clears both")
    void restoreClearsTheArchiveMetadata() {
        Equipment asset = liveAsset("EQ-LIFE-3");

        Equipment archived = equipmentService.archiveEquipment(asset.getId(), username);
        assertEquals(username, archived.getDeletedBy());
        assertTrue(archived.getDeletedAt() != null);

        Equipment restored = equipmentService.restoreEquipment(asset.getId(), username);
        assertEquals(null, restored.getDeletedBy());
        assertEquals(null, restored.getDeletedAt());
    }

    @Test
    @DisplayName("restoring an asset that was never archived is rejected")
    void restoringALiveAssetIsRejected() {
        Equipment asset = liveAsset("EQ-LIFE-4");

        // The archive lookup must not resolve a live asset, or "restore" silently becomes a no-op
        // that reports success on records nobody archived.
        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.restoreEquipment(asset.getId(), username));
    }

    @Test
    @DisplayName("an asset archived less than 90 days ago cannot be purged")
    void recentlyArchivedAssetCannotBePurged() {
        Equipment asset = liveAsset("EQ-LIFE-5");
        equipmentService.archiveEquipment(asset.getId(), username);

        // The retention window is the point of soft delete. It can only be enforced if the archived
        // row is reachable in the first place - previously this threw ResourceNotFoundException,
        // which reads as "already gone" rather than "not yet".
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> equipmentService.permanentlyDeleteEquipment(asset.getId(), username));
        assertTrue(exception.getMessage().contains("90 days"), exception.getMessage());
    }

    @Test
    @DisplayName("an asset archived more than 90 days ago can be purged")
    void longArchivedAssetCanBePurged() {
        Equipment asset = liveAsset("EQ-LIFE-6");
        equipmentService.archiveEquipment(asset.getId(), username);

        Equipment archived = equipmentRepository.findByIdAndDeletedTrue(asset.getId()).orElseThrow();
        archived.setDeletedAt(LocalDateTime.now().minusDays(91));
        equipmentRepository.saveAndFlush(archived);

        equipmentService.permanentlyDeleteEquipment(asset.getId(), username);

        assertTrue(equipmentRepository.findByIdAndDeletedTrue(asset.getId()).isEmpty(),
                "a purged asset must be gone from the archive as well as the inventory");
    }

    @Test
    @DisplayName("archiving is scoped to the caller's hospital")
    void archivingAnotherHospitalsAssetIsRejected() {
        User otherOwner = userRepository.save(User.builder()
                .name("Rival Owner")
                .username("rival-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0002")
                .organization("Rival Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital rival = hospitalRepository.save(Hospital.builder()
                .name("Rival Trust")
                .location("Other City")
                .user(otherOwner)
                .build());

        Equipment theirs = equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-RIVAL-1")
                .name("Their Scanner")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(rival)
                .build());

        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.archiveEquipment(theirs.getId(), username));
    }

    @Test
    @DisplayName("the archive listing does not leak another hospital's archived assets")
    void archiveListingIsTenantScoped() {
        Equipment mine = liveAsset("EQ-LIFE-7");
        equipmentService.archiveEquipment(mine.getId(), username);

        User otherOwner = userRepository.save(User.builder()
                .name("Rival Owner")
                .username("rival-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0003")
                .organization("Rival Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital rival = hospitalRepository.save(Hospital.builder()
                .name("Rival Trust")
                .location("Other City")
                .user(otherOwner)
                .build());
        equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-RIVAL-2")
                .name("Their Archived Scanner")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(rival)
                .deleted(true)
                .deletedAt(LocalDateTime.now())
                .deletedBy("their-admin")
                .build());

        Page<Equipment> archived =
                equipmentService.getArchivedEquipment(username, PageRequest.of(0, 10));

        assertEquals(1, archived.getTotalElements());
        assertEquals("EQ-LIFE-7", archived.getContent().get(0).getEquipmentCode());
    }
}
