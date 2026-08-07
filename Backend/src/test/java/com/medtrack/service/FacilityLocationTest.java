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

    @Test
    @DisplayName("location assignment is rejected when equipment status is RETIRED")
    void locationAssignmentBlockedForRetiredEquipment() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation room = node("Room 101", LocationType.ROOM, facility.getId());

        Equipment retiredAsset = equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-RETIRED-1")
                .name("Retired X-Ray Machine")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.RETIRED)
                .hospital(hospital)
                .build());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> locationService.assignEquipmentToLocation(
                        retiredAsset.getId(),
                        room.getId(),
                        LocalDate.now(),
                        "Attempting to reassign retired equipment",
                        username),
                "assigning a location to a retired asset must throw IllegalArgumentException");

        assertEquals(
                "Retired or disposed equipment cannot be assigned to a location",
                ex.getMessage());
    }

    @Test
    @DisplayName("location assignment is rejected when equipment status is DISPOSED")
    void locationAssignmentBlockedForDisposedEquipment() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation room = node("Room 102", LocationType.ROOM, facility.getId());

        Equipment disposedAsset = equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-DISPOSED-1")
                .name("Disposed Ultrasound Scanner")
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.DISPOSED)
                .hospital(hospital)
                .build());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> locationService.assignEquipmentToLocation(
                        disposedAsset.getId(),
                        room.getId(),
                        LocalDate.now(),
                        "Attempting to reassign disposed equipment",
                        username),
                "assigning a location to a disposed asset must throw IllegalArgumentException");

        assertEquals(
                "Retired or disposed equipment cannot be assigned to a location",
                ex.getMessage());
    }

    @Test
    @DisplayName("location assignment is permitted for active or under-maintenance equipment")
    void locationAssignmentAllowedForMaintenanceEquipment() {
        FacilityLocation facility = node("MedTrack General", LocationType.FACILITY, null);
        FacilityLocation workshop = node("Biomed Workshop", LocationType.ROOM, facility.getId());

        Equipment maintenanceAsset = equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-MNT-1")
                .name("Defibrillator in Workshop")
                .department("Emergency")
                .category(EquipmentCategory.MONITORING)
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .hospital(hospital)
                .build());

        Equipment updated = locationService.assignEquipmentToLocation(
                maintenanceAsset.getId(),
                workshop.getId(),
                LocalDate.now(),
                "Moved to workshop for calibration",
                username);

        assertNotNull(updated.getLocation(), "assigned location must not be null");
        assertEquals(workshop.getId(), updated.getLocation().getId(), "location id must match workshop");

        List<EquipmentLocationHistory> history =
                locationService.getEquipmentLocationHistory(maintenanceAsset.getId(), username);
        assertEquals(1, history.size(), "one location history record should be created");
        assertEquals("Moved to workshop for calibration", history.get(0).getNotes());
    }

    @Test
    @DisplayName("location assignment with null effective date defaults to current date")
    void locationAssignmentWithNullEffectiveDateDefaultsToToday() {
        FacilityLocation facility = node("MedTrack West", LocationType.FACILITY, null);
        FacilityLocation room = node("Storage Room", LocationType.ROOM, facility.getId());
        Equipment asset = asset("EQ-NULL-DATE");

        Equipment updated = locationService.assignEquipmentToLocation(
                asset.getId(),
                room.getId(),
                null,
                "Moved without explicit effective date",
                username);

        assertNotNull(updated.getLocation(), "location must be updated");
        List<EquipmentLocationHistory> history =
                locationService.getEquipmentLocationHistory(asset.getId(), username);
        assertEquals(1, history.size(), "history entry should be persisted");
        assertEquals(LocalDate.now(), history.get(0).getEffectiveDate(), "effective date should default to today");
        assertEquals("Moved without explicit effective date", history.get(0).getNotes());
    }

    @Test
    @DisplayName("location history preserves chronological audit entries across multiple moves")
    void locationHistoryPreservesAuditEntries() {
        FacilityLocation facility = node("MedTrack Central", LocationType.FACILITY, null);
        FacilityLocation roomA = node("Room A", LocationType.ROOM, facility.getId());
        FacilityLocation roomB = node("Room B", LocationType.ROOM, facility.getId());
        Equipment asset = asset("EQ-MULTI-MOVE");

        locationService.assignEquipmentToLocation(
                asset.getId(),
                roomA.getId(),
                LocalDate.now().minusDays(10),
                "Initial placement in Room A",
                username);
        locationService.assignEquipmentToLocation(
                asset.getId(),
                roomB.getId(),
                LocalDate.now(),
                "Relocated to Room B",
                username);

        List<EquipmentLocationHistory> history =
                locationService.getEquipmentLocationHistory(asset.getId(), username);
        assertEquals(2, history.size(), "both relocation history entries must be preserved");
        assertEquals(roomB.getId(), history.get(0).getLocation().getId(), "latest move should be first");
        assertEquals(roomA.getId(), history.get(1).getLocation().getId(), "earlier move should be second");
    }

    @Test
    @DisplayName("resolveDescendantIds includes root node and all nested child nodes in hierarchy")
    void resolveDescendantIdsIncludesAllSubtreeNodes() {
        FacilityLocation building = node("Main Building", LocationType.FACILITY, null);
        FacilityLocation floor1 = node("First Floor", LocationType.FLOOR, building.getId());
        FacilityLocation room101 = node("Room 101", LocationType.ROOM, floor1.getId());

        java.util.Set<Long> descendantIds = locationService.resolveDescendantIds(building.getId(), username);

        assertEquals(3, descendantIds.size(), "descendant set should include building, floor, and room");
        assertTrue(descendantIds.contains(building.getId()), "must contain root building id");
        assertTrue(descendantIds.contains(floor1.getId()), "must contain child floor id");
        assertTrue(descendantIds.contains(room101.getId()), "must contain grandchild room id");
    }

    @Test
    @DisplayName("createLocation validates required fields and parent location ownership")
    void createLocationValidatesNameTypeAndParentOwnership() {
        assertThrows(
                IllegalArgumentException.class,
                () -> locationService.createLocation(
                        FacilityLocation.builder().name("   ").locationType(LocationType.ROOM).build(),
                        username),
                "blank name must be rejected");

        assertThrows(
                IllegalArgumentException.class,
                () -> locationService.createLocation(
                        FacilityLocation.builder().name("ICU Room 1").locationType(null).build(),
                        username),
                "null location type must be rejected");

        User otherUser = userRepository.save(User.builder()
                .name("Other Hospital User")
                .username("other-user-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("password123")
                .role("hospital")
                .phone("+1 (555) 000-0099")
                .organization("Other Hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital otherHosp = hospitalRepository.save(Hospital.builder()
                .name("Other Hospital")
                .location("North")
                .user(otherUser)
                .build());
        FacilityLocation otherParent = locationRepository.save(FacilityLocation.builder()
                .name("Other Facility")
                .locationType(LocationType.FACILITY)
                .hospital(otherHosp)
                .createdBy(otherUser.getUsername())
                .build());

        assertThrows(
                com.medtrack.exception.ResourceNotFoundException.class,
                () -> locationService.createLocation(
                        FacilityLocation.builder()
                                .name("Cross Tenant Room")
                                .locationType(LocationType.ROOM)
                                .parentId(otherParent.getId())
                                .build(),
                        username),
                "parent location belonging to another hospital must be rejected");
    }

    @Test
    @DisplayName("updateLocation modifies location details while preserving unchanged fields")
    void updateLocationModifiesDetailsAndPreservesUnchanged() {
        FacilityLocation location = node("Old Name", LocationType.ROOM, null);

        FacilityLocation updated = locationService.updateLocation(
                location.getId(),
                FacilityLocation.builder().name("New Name").build(),
                username);

        assertEquals("New Name", updated.getName(), "name should be updated");
        assertEquals(LocationType.ROOM, updated.getLocationType(), "location type should be preserved");

        FacilityLocation typeUpdated = locationService.updateLocation(
                location.getId(),
                FacilityLocation.builder().locationType(LocationType.FLOOR).build(),
                username);

        assertEquals("New Name", typeUpdated.getName(), "name should remain preserved");
        assertEquals(LocationType.FLOOR, typeUpdated.getLocationType(), "location type should be updated");
    }

    @Test
    @DisplayName("getEquipmentLocationHistory returns empty list when equipment has no location history")
    void getEquipmentLocationHistoryReturnsEmptyListForUnmovedEquipment() {
        Equipment unassignedAsset = asset("EQ-UNASSIGNED-1");

        List<EquipmentLocationHistory> history =
                locationService.getEquipmentLocationHistory(unassignedAsset.getId(), username);

        assertNotNull(history, "returned history list must not be null");
        assertTrue(history.isEmpty(), "history list must be empty for unassigned equipment");
    }

    @Test
    @DisplayName("assignEquipmentToLocation rejects cross-tenant location assignment")
    void assignEquipmentToLocationRejectsCrossTenantLocation() {
        Equipment asset = asset("EQ-CROSS-LOC");

        User otherUser = userRepository.save(User.builder()
                .name("External Owner")
                .username("external-user-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("password123")
                .role("hospital")
                .phone("+1 (555) 000-0099")
                .organization("External Hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital externalHosp = hospitalRepository.save(Hospital.builder()
                .name("External Hospital")
                .location("East")
                .user(otherUser)
                .build());
        FacilityLocation externalLocation = locationRepository.save(FacilityLocation.builder()
                .name("External Ward")
                .locationType(LocationType.WING)
                .hospital(externalHosp)
                .createdBy(otherUser.getUsername())
                .build());

        assertThrows(
                com.medtrack.exception.ResourceNotFoundException.class,
                () -> locationService.assignEquipmentToLocation(
                        asset.getId(),
                        externalLocation.getId(),
                        LocalDate.now(),
                        "Cross tenant move",
                        username),
                "assigning location belonging to another hospital must be rejected");
    }

    @Test
    @DisplayName("assignEquipmentToLocation rejects cross-tenant equipment assignment")
    void assignEquipmentToLocationRejectsCrossTenantEquipment() {
        FacilityLocation location = node("Hospital Ward", LocationType.WING, null);

        User otherUser = userRepository.save(User.builder()
                .name("Other Hospital User")
                .username("other-owner-" + UUID.randomUUID())
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("password123")
                .role("hospital")
                .phone("+1 (555) 000-0099")
                .organization("Other Health System")
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        Hospital otherHosp = hospitalRepository.save(Hospital.builder()
                .name("Other Health System")
                .location("West")
                .user(otherUser)
                .build());

        Equipment otherEquipment = equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode("EQ-OTHER-HOSP")
                .name("Other Hospital Monitor")
                .department("ICU")
                .category(EquipmentCategory.MONITORING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(otherHosp)
                .build());

        assertThrows(
                com.medtrack.exception.ResourceNotFoundException.class,
                () -> locationService.assignEquipmentToLocation(
                        otherEquipment.getId(),
                        location.getId(),
                        LocalDate.now(),
                        "Attempting cross-tenant equipment assignment",
                        username),
                "assigning location to equipment belonging to another hospital must be rejected");
    }
}