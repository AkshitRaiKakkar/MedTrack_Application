package com.medtrack.controller;

import com.medtrack.dto.EquipmentReportRequest;
import com.medtrack.dto.EquipmentReportResponse;
import com.medtrack.service.EquipmentReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentReportController {

    private final EquipmentReportService equipmentReportService;

    @PostMapping("/report")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentReportResponse> generateReport(
            @RequestBody EquipmentReportRequest request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                equipmentReportService.generateReport(
                        request,
                        principal.getName()
                )
        );
    }
}