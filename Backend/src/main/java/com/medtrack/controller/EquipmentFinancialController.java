package com.medtrack.controller;

import com.medtrack.dto.EquipmentFinancialDashboardResponse;
import com.medtrack.dto.EquipmentFinancialResponse;
import com.medtrack.service.EquipmentFinancialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST endpoints for equipment financial analytics.
 */
@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class EquipmentFinancialController {

    private final EquipmentFinancialService equipmentFinancialService;

    /**
     * Returns overall financial dashboard.
     */
    @GetMapping("/financial-summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentFinancialDashboardResponse> getFinancialSummary(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentFinancialService.getFinancialDashboard(
                        principal.getName()
                )
        );
    }

    /**
     * Returns financial analysis for a single equipment.
     */
    @GetMapping("/{id}/financial-analysis")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentFinancialResponse> getFinancialAnalysis(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                equipmentFinancialService.getEquipmentFinancialAnalysis(
                        id,
                        principal.getName()
                )
        );
    }

    /**
     * Returns equipment that should be replaced soon.
     */
    @GetMapping("/replacement-recommendations")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentFinancialResponse>>
    getReplacementRecommendations(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentFinancialService.getReplacementRecommendations(
                        principal.getName()
                )
        );
    }
}