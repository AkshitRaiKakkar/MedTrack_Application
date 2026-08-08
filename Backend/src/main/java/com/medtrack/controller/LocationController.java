package com.medtrack.controller;

import com.medtrack.dto.LocationAssignRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLocationHistory;
import com.medtrack.model.FacilityLocation;
import com.medtrack.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * Facility location tree + per-asset location history (issue #745).
 *
 * <p>Reading the tree is open to any authenticated user; managing nodes and assignments is
 * restricted to the HOSPITAL role, matching the rest of the asset-management surface.</p>
 */
@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<List<FacilityLocation>> getLocationTree(Principal principal) {
        return ResponseEntity.ok(locationService.getLocationTree(principal.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<FacilityLocation> createLocation(@Valid @RequestBody FacilityLocation location,
                                                           Principal principal) {
        return ResponseEntity.ok(locationService.createLocation(location, principal.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<FacilityLocation> updateLocation(@PathVariable Long id,
                                                           @Valid @RequestBody FacilityLocation location,
                                                           Principal principal) {
        validateId(id);
        return ResponseEntity.ok(locationService.updateLocation(id, location, principal.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id, Principal principal) {
        validateId(id);
        locationService.deleteLocation(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/equipment/{equipmentId}/history")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentLocationHistory>> getEquipmentLocationHistory(
            @PathVariable Long equipmentId,
            Principal principal) {
        validateId(equipmentId);
        return ResponseEntity.ok(locationService.getEquipmentLocationHistory(equipmentId, principal.getName()));
    }

    @PostMapping("/equipment/{equipmentId}/assign")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> assignEquipmentToLocation(
            @PathVariable Long equipmentId,
            @Valid @RequestBody LocationAssignRequest request,
            Principal principal) {
        validateId(equipmentId);
        return ResponseEntity.ok(locationService.assignEquipmentToLocation(
                equipmentId,
                request.getLocationId(),
                request.getEffectiveDate(),
                request.getNotes(),
                principal.getName()));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}