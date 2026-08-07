package com.medtrack.controller;

import com.medtrack.dto.DuplicateGroupResponse;
import com.medtrack.dto.DuplicateMatch;
import com.medtrack.model.Equipment;
import com.medtrack.service.DuplicateDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * Duplicate detection & tag reconciliation (issue #746).
 *
 * <p>Literal {@code /api/equipment/duplicates} paths - Spring resolves a literal segment over the
 * {@code /api/equipment/{id}} path variable, matching the existing {@code /archived} and
 * {@code /search} endpoints. Reconciliation is restricted to hospital staff.</p>
 */
@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DuplicateController {

    private final DuplicateDetectionService duplicateDetectionService;

    /**
     * Likely paper-record clusters for the reconciliation view.
     */
    @GetMapping("/duplicates")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<DuplicateGroupResponse>> getDuplicateGroups(Principal principal) {
        return ResponseEntity.ok(duplicateDetectionService.findDuplicateGroups(principal.getName()));
    }

    /**
     * Entry-time warning feed for the registration/editing form: does this asset closely match an
     * existing one? {@code excludeId} suppresses the asset's own record while editing.
     */
    @GetMapping("/duplicates/check")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<DuplicateMatch>> checkForDuplicates(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) String equipmentCode,
            @RequestParam(required = false) Long excludeId,
            Principal principal) {
        return ResponseEntity.ok(duplicateDetectionService.checkForDuplicates(
                principal.getName(), excludeId, name, model, serialNumber, equipmentCode));
    }

    /**
     * Confirms a duplicate pair has been reviewed: the duplicate is archived, its history is
     * moved onto the surviving record.
     */
    @PostMapping("/duplicates/merge")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> mergeDuplicates(
            @RequestParam Long keepId,
            @RequestParam Long mergeId,
            Principal principal) {
        return ResponseEntity.ok(duplicateDetectionService.mergeDuplicates(keepId, mergeId, principal.getName()));
    }
}