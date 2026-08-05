package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.EquipmentLocationHistory;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.LocationType;
import com.medtrack.repository.EquipmentLocationHistoryRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Facility location tree, hierarchical filtering and per-asset location history (issue #745),
 * exercised end to end through {@link LocationService} and the location-aware equipment queries.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:location-tree-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("facility location tree and assignment history")
class FacilityLocationTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private LocationService locationService;

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private FacilityLocationRepository locationRepository;

    @Autowired
    private EquipmentLocationHistoryRepository historyRepository;

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
        username = "location-owner-" + UUID.randomUUID();

        User owner = userRepository.save(User.builder()
                .name("Location Owner")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0002")
                .organization("Location Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Location Trust")
                .location("Test City")
                .user(owner)
                .build());
    }

    private FacilityLocation node(String name, LocationType type, Long parentId) {
        return locationService.createLocation(FacilityLocation.builder()
                .name(name)
                .locationType(type)
                .parentId(parentId)
                .build(), username);
    }

    private Equipment asset(String code) {
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
    @DisplayName("a facility - floor - room tree round-trips and carries tenant metadata")
    void treeCanBeCreatedAndRead() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation floor = node("Floor 1", LocationType.FLOOR, facility.getId());
        FacilityLocation room = node("MRI Suite 101", LocationType.ROOM, floor.getId());

        List<FacilityLocation> tree = locationService.getLocationTree(username);

        assertEquals(3, tree.size());
        assertEquals(facility.getId(), floor.getParentId());
        assertEquals(floor.getId(), room.getParentId());
        assertEquals(LocationType.ROOM, room.getLocationType());
    }

    @Test
    @DisplayName("assigning equipment records the current location and an audit entry")
    void assignmentUpdatesLocationAndWritesHistory() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation floor = node("Floor 1", LocationType.FLOOR, facility.getId());
        FacilityLocation room = node("MRI Suite 101", LocationType.ROOM, floor.getId());
        Equipment asset = asset("EQ-LOC-1");

        Equipment assigned = locationService.assignEquipmentToLocation(
                asset.getId(), room.getId(), LocalDate.now(), "initial placement", username);

        assertNotNull(assigned.getLocation());
        assertEquals(room.getId(), assigned.getLocation().getId());

        List<EquipmentLocationHistory> history =
                locationService.getEquipmentLocationHistory(asset.getId(), username);
        assertEquals(1, history.size());
        assertEquals(room.getId(), history.get(0).getLocation().getId());
        assertEquals(username, history.get(0).getMovedBy());
    }

    @Test
    @DisplayName("filtering by a node returns assets placed anywhere beneath it")
    void hierarchicalFilterCoversTheWholeSubtree() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation floor = node("Floor 1", LocationType.FLOOR, facility.getId());
        FacilityLocation roomA = node("MRI Suite 101", LocationType.ROOM, floor.getId());
        FacilityLocation roomB = node("Lab 202", LocationType.ROOM, floor.getId());
        FacilityLocation otherFloor = node("Floor 2", LocationType.FLOOR, facility.getId());
        FacilityLocation roomC = node("ICU 301", LocationType.ROOM, otherFloor.getId());

        Equipment mri = asset("EQ-LOC-2");
        Equipment lab = asset("EQ-LOC-3");
        Equipment icu = asset("EQ-LOC-4");

        locationService.assignEquipmentToLocation(mri.getId(), roomA.getId(), null, null, username);
        locationService.assignEquipmentToLocation(lab.getId(), roomB.getId(), null, null, username);
        locationService.assignEquipmentToLocation(icu.getId(), roomC.getId(), null, null, username);

        Page<Equipment> onFloorOne =
                equipmentService.getAllEquipment(username, floor.getId(), PageRequest.of(0, 20));
        assertEquals(2, onFloorOne.getTotalElements(),
                "a floor filter must include assets in every room beneath it");

        Page<Equipment> acrossFacility =
                equipmentService.getAllEquipment(username, facility.getId(), PageRequest.of(0, 20));
        assertEquals(3, acrossFacility.getTotalElements(),
                "a facility filter must include assets on every floor beneath it");

        Page<Equipment> inIcu =
                equipmentService.getAllEquipment(username, roomC.getId(), PageRequest.of(0, 20));
        assertEquals(1, inIcu.getTotalElements());

        Page<Equipment> unrestricted =
                equipmentService.getAllEquipment(username, null, PageRequest.of(0, 20));
        assertEquals(3, unrestricted.getTotalElements());
    }

    @Test
    @DisplayName("nodes with children or assigned equipment cannot be deleted")
    void deletionIsBlockedForNodesInUse() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation floor = node("Floor 1", LocationType.FLOOR, facility.getId());
        FacilityLocation room = node("MRI Suite 101", LocationType.ROOM, floor.getId());

        assertThrows(IllegalArgumentException.class,
                () -> locationService.deleteLocation(facility.getId(), username),
                "a facility with child floors must not be deletable");
        assertThrows(IllegalArgumentException.class,
                () -> locationService.deleteLocation(floor.getId(), username),
                "a floor with child rooms must not be deletable");

        Equipment asset = asset("EQ-LOC-5");
        locationService.assignEquipmentToLocation(asset.getId(), room.getId(), null, null, username);
        assertThrows(IllegalArgumentException.class,
                () -> locationService.deleteLocation(room.getId(), username),
                "a room with assigned equipment must not be deletable");

        FacilityLocation empty = node("Lobby", LocationType.ROOM, floor.getId());
        locationService.deleteLocation(empty.getId(), username);
        assertTrue(locationService.getLocationTree(username).stream()
                        .noneMatch(node -> node.getId().equals(empty.getId())),
                "an unused node must be deletable");
    }

    @Test
    @DisplayName("another hospital cannot see, reassign to or delete this hospital's nodes")
    void locationsAreTenantIsolated() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation room = node("MRI Suite 101", LocationType.ROOM, facility.getId());
        Equipment asset = asset("EQ-LOC-6");

        User other = userRepository.save(User.builder()
                .name("Other Owner")
                .username("other-location-owner-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0003")
                .organization("Other Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital otherHospital = hospitalRepository.save(Hospital.builder()
                .name("Other Trust")
                .location("Elsewhere")
                .user(other)
                .build());

        assertTrue(locationService.getLocationTree(other.getUsername()).isEmpty(),
                "the tree must be scoped to the caller's hospital");

        assertThrows(Exception.class, () -> locationService.deleteLocation(room.getId(), other.getUsername()),
                "another tenant must not be able to delete this hospital's node");
        assertThrows(Exception.class,
                () -> locationService.assignEquipmentToLocation(asset.getId(), room.getId(), null, null, other.getUsername()),
                "another tenant must not be able to assign equipment to this hospital's node");
    }
}