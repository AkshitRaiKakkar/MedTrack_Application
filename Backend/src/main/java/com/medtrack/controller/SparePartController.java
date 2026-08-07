package com.medtrack.controller;

import com.medtrack.dto.SparePartCreateRequest;
import com.medtrack.dto.SparePartDeductRequest;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.dto.SparePartUpdateRequest;
import com.medtrack.service.SparePartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spare-parts")
@RequiredArgsConstructor
public class SparePartController {

    private final SparePartService sparePartService;

    @GetMapping
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<List<SparePartResponse>> getAllSpareParts(Authentication authentication) {
        return ResponseEntity.ok(sparePartService.getAllSpareParts(authentication.getName()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<SparePartResponse>> getLowStockAlerts(Authentication authentication) {
        return ResponseEntity.ok(sparePartService.getLowStockAlerts(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SparePartResponse> createSparePart(
            @Valid @RequestBody SparePartCreateRequest request,
            Authentication authentication) {
        SparePartResponse created = sparePartService.createSparePart(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SparePartResponse> updateSparePart(
            @PathVariable Long id,
            @Valid @RequestBody SparePartUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(sparePartService.updateSparePart(id, request, authentication.getName()));
    }

    @PostMapping("/deduct")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<SparePartResponse> deductStock(
            @Valid @RequestBody SparePartDeductRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(sparePartService.deductStock(request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteSparePart(
            @PathVariable Long id,
            Authentication authentication) {
        sparePartService.deleteSparePart(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
