package com.medtrack.controller;

import com.medtrack.dto.SparePartDeductRequest;
import com.medtrack.model.SparePart;
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
    public ResponseEntity<List<SparePart>> getAllSpareParts(Authentication authentication) {
        return ResponseEntity.ok(sparePartService.getAllSpareParts(authentication.getName()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<SparePart>> getLowStockAlerts(Authentication authentication) {
        return ResponseEntity.ok(sparePartService.getLowStockAlerts(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SparePart> createSparePart(
            @Valid @RequestBody SparePart sparePart,
            Authentication authentication) {
        SparePart created = sparePartService.createSparePart(sparePart, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<SparePart> updateSparePart(
            @PathVariable Long id,
            @Valid @RequestBody SparePart sparePart,
            Authentication authentication) {
        return ResponseEntity.ok(sparePartService.updateSparePart(id, sparePart, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteSparePart(
            @PathVariable Long id,
            Authentication authentication) {
        sparePartService.deleteSparePart(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/deduct")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<Void> deductStock(
            @Valid @RequestBody SparePartDeductRequest request,
            Authentication authentication) {
        sparePartService.deductStock(request.getPartNumber(), request.getQuantity(), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restock")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> restockStock(
            @Valid @RequestBody SparePartDeductRequest request,
            Authentication authentication) {
        sparePartService.restockStock(request.getPartNumber(), request.getQuantity(), authentication.getName());
        return ResponseEntity.ok().build();
    }
}
