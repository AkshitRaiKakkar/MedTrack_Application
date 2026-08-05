package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.dto.DuplicateGroupResponse;
import com.medtrack.dto.DuplicateMatch;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
/**
 * Duplicate detection & tag reconciliation (issue #746), exercised through
 * {@link DuplicateDetectionService} end to end.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:duplicate-detection-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("duplicate detection and reconciliation")
class DuplicateDetectionTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private DuplicateDetectionService duplicateDetectionService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private EquipmentLifecycleActionRepository lifecycleRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private String username;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        username = "duplicates-owner-" + UUID.randomUUID();

        User owner = userRepository.save(User.builder()
                .name("Duplicates Owner")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0004")
                .organization("Duplicates Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Duplicates Trust")
                .location("Test City")
                .user(owner)
                .build());
    }

    private Equipment asset(String code, String serial, String name, String model) {
        return equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode(code)
                .serialNumber(serial)
                .name(name)
                .model(model)
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .quantity(1)
                .hospital(hospital)
                .build());
    }

    @Test
    @DisplayName("entry-time check flags a typo-variant serial but not an unrelated asset")
    void checkFlagsNearDuplicatesOnly() {
        Equipment mri = asset("EQ-DUP-1", "MRI-1001", "MRI Scanner", "Siemens X1");

        List<DuplicateMatch> matches = duplicateDetectionService.checkForDuplicates(
                username, null, null, null, "MRI 1001", null);

        assertEquals(1, matches.size());
        DuplicateMatch match = matches.get(0);
        assertEquals(mri.getId(), match.getId());
        assertEquals("SERIAL_NUMBER", match.getMatchedOn());
        assertTrue(match.getSimilarity() >= 0.8,
                "the normalised difference between 'MRI-1001' and 'MRI 1001' is only a hyphen");

        List<DuplicateMatch> unrelated = duplicateDetectionService.checkForDuplicates(
                username, null, null, null, "VENT-9999-X", null);
        assertTrue(unrelated.isEmpty(), "a non-matching serial must not warn");
    }

    @Test
    @DisplayName("editing excludes the asset's own record from the warning")
    void checkExcludesTheRecordBeingEdited() {
        Equipment mri = asset("EQ-DUP-2", "MRI-1002", "MRI Scanner", "Siemens X1");

        List<DuplicateMatch> matches = duplicateDetectionService.checkForDuplicates(
                username, mri.getId(), null, null, "MRI-1002", null);

        assertTrue(matches.isEmpty(), "an asset must not warn about itself while editing");
    }

    @Test
    @DisplayName("reconciliation groups assets sharing serial, code or name+model")
    void reconciliationGroupsLikelyDuplicates() {
        // Same physical scanner entered twice with different codes but the same serial.
        asset("EQ-DUP-3", "MRI-1003", "MRI Scanner", "Siemens X1");
        asset("EQ-DUP-4", "MRI-1003", "MRI Scanner", "Siemens X1");
        asset("EQ-DUP-5", "VENT-2001", "Ventilator", "GE Vent 900");

        List<DuplicateGroupResponse> groups = duplicateDetectionService.findDuplicateGroups(username);

        assertEquals(1, groups.size());
        assertEquals("SERIAL_NUMBER", groups.get(0).getMatchedOn());
        assertEquals(2, groups.get(0).getAssets().size());
    }

    @Test
    @DisplayName("merging combines stock, carries history to the survivor and archives the duplicate")
    void mergeKeepsOneRecordWithFullHistory() {
        Equipment first = asset("EQ-DUP-6", "MRI-1006", "MRI Scanner", "Siemens X1");
        Equipment second = asset("EQ-DUP-7", "MRI-1006", "MRI Scanner", "Siemens X1");

        lifecycleRepository.save(EquipmentLifecycleAction.builder()
                .equipment(second)
                .hospital(hospital)
                .actionType(EquipmentLifecycleActionType.TRANSFER)
                .status(EquipmentLifecycleStatus.COMPLETED)
                .requestedBy(username)
                .build());

        Equipment survivor = duplicateDetectionService.mergeDuplicates(first.getId(), second.getId(), username);

        assertEquals(first.getId(), survivor.getId());
        assertEquals(2, survivor.getQuantity(), "unit counts of the two records must combine");

        List<EquipmentLifecycleAction> history =
                lifecycleRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(first.getId(), hospital.getId());
        assertFalse(history.isEmpty(), "lifecycle history must move onto the surviving record");

        List<DuplicateGroupResponse> groups = duplicateDetectionService.findDuplicateGroups(username);
        assertTrue(groups.isEmpty(), "after the merge no duplicate group may remain");
    }
}