package com.medtrack.controller;

import com.medtrack.dto.EquipmentStatisticsResponse;
import com.medtrack.dto.LowStockSummaryResponse;
import com.medtrack.dto.StockAdjustmentRequest;
import com.medtrack.dto.WarrantySummaryResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.medtrack.dto.EquipmentDashboardResponse;
import java.time.LocalDate;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * Retrieves a paginated list of equipment records associated with the authenticated hospital.
     *
     * @param pageable  pagination information (page, size, sort)
     * @param principal the authenticated user's security principal
     * @return a paginated response of equipment records
     */
    @GetMapping
    public ResponseEntity<com.medtrack.dto.PagedResponse<Equipment>> getAllEquipment(
            @PageableDefault(sort = "name") Pageable pageable,
            Principal principal) {

        return ResponseEntity.ok(
                com.medtrack.dto.PagedResponse.of(
                        equipmentService.getAllEquipment(principal.getName(), pageable)
                )
        );
    }

    @GetMapping("/category-summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Map<String, Long>> getCategorySummary(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getCategorySummary(
                        principal.getName()
                )
        );
    }

    @GetMapping("/department")
    public ResponseEntity<List<Equipment>> getEquipmentByDepartment(
            @RequestParam String department,
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentByDepartment(
                        department,
                        principal.getName()
                )
        );
    }

    @GetMapping("/age-summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Map<String, Long>> getEquipmentAgeSummary(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentAgeSummary(
                        principal.getName()
                )
        );
    }

    @GetMapping("/statistics")
    public ResponseEntity<EquipmentStatisticsResponse> getStatistics(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentStatistics(
                        principal.getName()
                )
        );
    }

    /**
     * Fleet valuation: total purchase cost, current book value and projected replacement cost,
     * with per-category and per-asset breakdowns. Backs the finance widgets on the analytics
     * dashboard. Accessible only to users with the HOSPITAL role.
     *
     * @param principal the authenticated user's security principal
     * @return the valuation summary
     */
    @GetMapping("/valuation")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<com.medtrack.dto.EquipmentValuationResponse> getEquipmentValuation(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentValuation(
                        principal.getName()
                )
        );
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<EquipmentDashboardResponse> getDashboard(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getDashboardOverview(
                        principal.getName()
                )
        );
    }

    /**
     * Retrieves a specific equipment record by its ID.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return the requested equipment record
     */
    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable Long id, Principal principal) {
        validateId(id);
        return ResponseEntity.ok(equipmentService.getEquipmentById(id, principal.getName()));
    }

    @GetMapping("/warranty-summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<WarrantySummaryResponse> getWarrantySummary(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getWarrantySummary(
                        principal.getName()
                )
        );
    }

    /**
     * Creates a new equipment record.
     *
     * @param equipment the equipment details to create
     * @param principal the authenticated user's security principal
     * @return the created equipment record
     */
    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> addEquipment(@Valid @RequestBody Equipment equipment, Principal principal) {
        return ResponseEntity.ok(equipmentService.addEquipment(equipment, principal.getName()));
    }

    /**
     * Updates an existing equipment record.
     *
     * @param id the equipment identifier
     * @param equipment the updated equipment details
     * @param principal the authenticated user's security principal
     * @return the updated equipment record
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable Long id,
                                                     @Valid @RequestBody Equipment equipment,
                                                     Principal principal) {
        validateId(id);
        return ResponseEntity.ok(equipmentService.updateEquipment(id, equipment, principal.getName()));
    }

    /**
     * Deletes an equipment record by its ID.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return HTTP 204 No Content when the deletion is successful
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Long id, Principal principal) {
        validateId(id);
        equipmentService.deleteEquipment(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Archives (soft deletes) an equipment record.
     * Instead of hard deleting, sets deleted = true for audit compliance.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return the archived equipment record
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> archiveEquipment(@PathVariable Long id, Principal principal) {
        validateId(id);
        Equipment archived = equipmentService.archiveEquipment(id, principal.getName());
        return ResponseEntity.ok(archived);
    }

    /**
     * Restores an archived equipment record.
     * Only available within 90 days of archival.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return the restored equipment record
     */
    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> restoreEquipment(@PathVariable Long id, Principal principal) {
        validateId(id);
        Equipment restored = equipmentService.restoreEquipment(id, principal.getName());
        return ResponseEntity.ok(restored);
    }

    /**
     * Lists all archived (soft-deleted) equipment for the user's hospital.
     *
     * @param pageable pagination parameters
     * @param principal the authenticated user's security principal
     * @return paginated list of archived equipment
     */
    @GetMapping("/archived")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Page<Equipment>> getArchivedEquipment(
            @PageableDefault(sort = "deletedAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {
        return ResponseEntity.ok(equipmentService.getArchivedEquipment(principal.getName(), pageable));
    }

    /**
     * Permanently deletes an archived equipment record (admin only).
     * Only callable after 90 days from archival.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return HTTP 204 No Content when successful
     */
    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> permanentlyDeleteEquipment(@PathVariable Long id, Principal principal) {
        validateId(id);
        equipmentService.permanentlyDeleteEquipment(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Imports equipment from an uploaded CSV file.
     * Accessible only to users with the HOSPITAL role.
     *
     * @param file the CSV file to import
     * @param principal the authenticated user's security principal
     * @return the import summary
     */
    @PostMapping("/import")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<com.medtrack.dto.EquipmentImportSummary> importEquipment(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Principal principal) {
        return ResponseEntity.ok(equipmentService.importEquipmentFromCsv(file, principal.getName()));
    }

    /**
     * Dry-runs an equipment import: validates every row of the uploaded CSV without writing
     * anything, so the UI can show what would be imported and which rows carry errors before
     * the user confirms. Accessible only to users with the HOSPITAL role.
     *
     * @param file the CSV file to preview
     * @param principal the authenticated user's security principal
     * @return the rows that would be imported plus per-row failures
     */
    @PostMapping("/import/preview")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<com.medtrack.dto.EquipmentImportPreviewResponse> previewImport(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Principal principal) {
        return ResponseEntity.ok(equipmentService.previewEquipmentImport(file, principal.getName()));
    }

    /**
     * Recent bulk import batches for the authenticated hospital, newest first.
     * Accessible only to users with the HOSPITAL role.
     *
     * @param principal the authenticated user's security principal
     * @return the most recent import audit entries
     */
    @GetMapping("/imports/audit")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<com.medtrack.model.EquipmentImportAuditLog>> getImportAuditLogs(
            Principal principal) {
        return ResponseEntity.ok(equipmentService.getImportAuditLogs(principal.getName()));
    }

    /**
     * Generates a QR Code for a specific equipment record.
     * Accessible to any authenticated user.
     *
     * @param id the equipment identifier
     * @param principal the authenticated user's security principal
     * @return a JSON object containing the base64 encoded QR Code string
     */
    @GetMapping("/{id}/qr-code")
    public ResponseEntity<java.util.Map<String, String>> getQrCode(
            @PathVariable Long id,
            Principal principal) {
        String base64Qr = equipmentService.generateQrCodeBase64(id, principal.getName());
        return ResponseEntity.ok(java.util.Map.of("qrCode", base64Qr));
    }

    @GetMapping("/purchase-range")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<Equipment>> getEquipmentByPurchaseRange(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentByPurchaseDateRange(
                        principal.getName(),
                        startDate,
                        endDate
                )
        );
    }
    /**
     * Retrieves equipment whose warranty has already expired.
     */
    @GetMapping("/warranty/expired")
    public ResponseEntity<List<Equipment>> getExpiredWarrantyEquipment(Principal principal) {
        return ResponseEntity.ok(
                equipmentService.getExpiredWarrantyEquipment(principal.getName())
        );
    }

    /**
     * Retrieves equipment whose warranty will expire within the configured threshold.
     */
    @GetMapping("/warranty/expiring-soon")
    public ResponseEntity<List<Equipment>> getWarrantyExpiringSoon(Principal principal) {
        return ResponseEntity.ok(
                equipmentService.getWarrantyExpiringSoon(principal.getName())
        );
    }
    @GetMapping("/search")
    public ResponseEntity<List<Equipment>> searchEquipment(
            @RequestParam String keyword,
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.searchEquipment(keyword, principal.getName())
        );
    }

    /**
     * Retrieves equipment using multiple optional filters.
     */
    @GetMapping("/filter")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<Equipment>> filterEquipment(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) EquipmentCategory category,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) String model,
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.filterEquipment(
                        principal.getName(),
                        department,
                        category,
                        status,
                        model
                )
        );
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<byte[]> exportEquipment(Principal principal) {

        byte[] csv = equipmentService.exportEquipmentCsv(principal.getName());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=equipment.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    /**
     * Retrieves all equipment that is currently below the configured stock threshold.
     *
     * @param principal the authenticated user's security principal
     * @return list of low stock equipment
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<Equipment>> getLowStockEquipment(Principal principal) {
        return ResponseEntity.ok(
                equipmentService.getLowStockEquipment(principal.getName())
        );
    }

    /**
     * Returns aggregate stock counters for the authenticated hospital.
     *
     * <p>Dashboard tiles need counts, not rows. Without this the client has to fetch
     * {@code /low-stock} and measure the array on every poll.</p>
     *
     * @param principal the authenticated user's security principal
     * @return tracked, low-stock, out-of-stock and total-unit counts
     */
    @GetMapping("/low-stock/summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<LowStockSummaryResponse> getLowStockSummary(Principal principal) {
        return ResponseEntity.ok(
                equipmentService.getLowStockSummary(principal.getName())
        );
    }

    /**
     * Applies a signed stock movement to a single asset.
     *
     * <p>{@code PATCH} rather than {@code PUT} because this is a partial, relative change:
     * receiving five units is {@code {"delta": 5}}, consuming two is {@code {"delta": -2}}.
     * Sending an absolute quantity through the full update endpoint loses concurrent movements.</p>
     *
     * @param id        the equipment identifier
     * @param request   the movement to apply
     * @param principal the authenticated user's security principal
     * @return the updated equipment record
     */
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Equipment> adjustStock(@PathVariable Long id,
                                                 @Valid @RequestBody StockAdjustmentRequest request,
                                                 Principal principal) {
        validateId(id);
        return ResponseEntity.ok(
                equipmentService.adjustStock(id, request, principal.getName())
        );
    }

    @GetMapping("/status-summary")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Map<EquipmentStatus, Long>> getStatusSummary(
            Principal principal) {

        return ResponseEntity.ok(
                equipmentService.getEquipmentStatusSummary(
                        principal.getName()
                )
        );
    }

    /**
     * Validates that a resource ID is a positive number.
     *
     * @param id the resource identifier
     * @throws IllegalArgumentException if the ID is less than or equal to zero
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid resource ID.");
        }
    }
}