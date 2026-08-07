package com.medtrack.controller;

import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.service.EquipmentAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentAuditController {

    private final EquipmentAuditService equipmentAuditService;

    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<EquipmentAuditResponse>> getEquipmentHistory(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(
                equipmentAuditService.getEquipmentHistory(id)
        );
    }
}