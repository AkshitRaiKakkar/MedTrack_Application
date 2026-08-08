package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLocationHistory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentLocationHistoryRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Facility location tree management and per-asset location assignment/history (issue #745).
 *
 * <p>The tree is hospital-scoped: every operation resolves the caller's hospital from their
 * principal and refuses nodes belonging to any other tenant.</p>
 */
@Service
@RequiredArgsConstructor
public class LocationService {

    private final FacilityLocationRepository facilityLocationRepository;
    private final EquipmentLocationHistoryRepository historyRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    @Transactional(readOnly = true)
    public List<FacilityLocation> getLocationTree(String username) {
        Hospital hospital = getHospitalForUser(username);
        return facilityLocationRepository.findByHospitalId(hospital.getId());
    }

    @Transactional
    public FacilityLocation createLocation(FacilityLocation location, String username) {
        Hospital hospital = getHospitalForUser(username);
        if (location.getName() == null || location.getName().isBlank()) {
            throw new IllegalArgumentException("Location name is required");
        }
        if (location.getLocationType() == null) {
            throw new IllegalArgumentException("Location type is required");
        }
        if (location.getParentId() != null) {
            FacilityLocation parent = facilityLocationRepository.findById(location.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent location not found"));
            if (!parent.getHospital().getId().equals(hospital.getId())) {
                throw new ResourceNotFoundException("Parent location not found or you don't have access");
            }
        }
        location.setId(null);
        location.setHospital(hospital);
        location.setCreatedBy(username);
        return facilityLocationRepository.save(location);
    }

    @Transactional
    public FacilityLocation updateLocation(Long id, FacilityLocation details, String username) {
        Hospital hospital = getHospitalForUser(username);
        FacilityLocation location = facilityLocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Location not found or you don't have access");
        }
        if (details.getName() != null) {
            location.setName(details.getName());
        }
        if (details.getLocationType() != null) {
            location.setLocationType(details.getLocationType());
        }
        return facilityLocationRepository.save(location);
    }

    @Transactional
    public void deleteLocation(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        FacilityLocation location = facilityLocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Location not found or you don't have access");
        }
        if (facilityLocationRepository.countByParentId(id) > 0) {
            throw new IllegalArgumentException("Location has child locations and cannot be deleted");
        }
        if (historyRepository.countByLocationId(id) > 0) {
            throw new IllegalArgumentException("Location has equipment assigned and cannot be deleted");
        }
        facilityLocationRepository.delete(location);
    }

    @Transactional
    public Equipment assignEquipmentToLocation(Long equipmentId, Long locationId, LocalDate effectiveDate,
                                               String notes, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
        validateEquipmentActiveForLocationAssignment(equipment);

        FacilityLocation location = facilityLocationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Location not found or you don't have access");
        }

        equipment.setLocation(location);
        if (effectiveDate != null) {
            equipment.setLocationEffectiveDate(effectiveDate);
        }
        equipmentRepository.save(equipment);

        historyRepository.save(EquipmentLocationHistory.builder()
                .equipment(equipment)
                .hospital(hospital)
                .location(location)
                .effectiveDate(effectiveDate != null ? effectiveDate : LocalDate.now())
                .notes(notes)
                .movedBy(username)
                .build());

        return equipment;
    }

    @Transactional(readOnly = true)
    public List<EquipmentLocationHistory> getEquipmentLocationHistory(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
        return historyRepository.findByEquipmentIdOrderByCreatedAtDesc(equipment.getId());
    }

    /**
     * Resolves the id of a location together with all of its descendants, so a filter on a floor
     * matches assets placed anywhere beneath it (issue #745 hierarchical filtering).
     */
    @Transactional(readOnly = true)
    public Set<Long> resolveDescendantIds(Long rootId, String username) {
        Hospital hospital = getHospitalForUser(username);
        List<FacilityLocation> all = facilityLocationRepository.findByHospitalId(hospital.getId());
        Set<Long> ids = new HashSet<>();
        Set<Long> pending = new HashSet<>();
        pending.add(rootId);
        while (!pending.isEmpty()) {
            Set<Long> next = new HashSet<>();
            for (Long parent : pending) {
                for (FacilityLocation location : all) {
                    if (parent.equals(location.getParentId())) {
                        ids.add(location.getId());
                        next.add(location.getId());
                    }
                }
            }
            pending = next;
        }
        ids.add(rootId);
        return ids;
    }

    private void validateEquipmentActiveForLocationAssignment(Equipment equipment) {
        if (equipment.getStatus() == EquipmentStatus.RETIRED
                || equipment.getStatus() == EquipmentStatus.DISPOSED) {
            throw new IllegalArgumentException(
                    "Retired or disposed equipment cannot be assigned to a location");
        }
    }
}