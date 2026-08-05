package com.medtrack.supplier.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.supplier.dto.*;
import com.medtrack.supplier.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/supplier/dashboard")
@RequiredArgsConstructor
@Tag(name = "Supplier Dashboard API", description = "Endpoints for supplier dashboard and operational insights")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    private Long resolveSupplierId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                return userOpt.get().getId();
            }
        }
        return 1L; // default fallback ID
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Full Dashboard", description = "Aggregates all dashboard metrics for the logged-in supplier")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard(resolveSupplierId()));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Dashboard Summary", description = "Retrieves high-level summary of order statuses")
    public ResponseEntity<DashboardSummary> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary(resolveSupplierId()));
    }

    @GetMapping("/performance")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Supplier Performance", description = "Retrieves performance score and rating")
    public ResponseEntity<SupplierPerformance> getPerformance() {
        return ResponseEntity.ok(dashboardService.getPerformanceScore(resolveSupplierId()));
    }

    @GetMapping("/delays")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delay Analytics", description = "Retrieves delay metrics and percentage for shipments")
    public ResponseEntity<DelayAnalytics> getDelayAnalytics() {
        DashboardResponse response = dashboardService.getDashboard(resolveSupplierId());
        return ResponseEntity.ok(response.getDelayAnalytics());
    }

    @GetMapping("/shipments")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Statistics", description = "Retrieves overarching shipment statistics and success rates")
    public ResponseEntity<ShipmentStatistics> getShipmentStatistics() {
        DashboardResponse response = dashboardService.getDashboard(resolveSupplierId());
        return ResponseEntity.ok(response.getShipmentStatistics());
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Order Statistics API compatibility endpoint", description = "Maps to overall dashboard response or stats summary")
    public ResponseEntity<DashboardResponse> getStatistics() {
        // As per Step 2: "GET /api/supplier/dashboard/statistics"
        return ResponseEntity.ok(dashboardService.getDashboard(resolveSupplierId()));
    }

    @GetMapping("/reports/monthly")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Monthly Order Summary", description = "Generates monthly shipments report")
    public ResponseEntity<java.util.List<MonthlyShipmentReport>> getMonthlyOrderSummary() {
        return ResponseEntity.ok(dashboardService.getMonthlyReports(resolveSupplierId()));
    }

    @GetMapping("/reports/status-distribution")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Status Distribution", description = "Generates distribution of shipment statuses")
    public ResponseEntity<java.util.Map<String, Long>> getStatusDistribution() {
        return ResponseEntity.ok(dashboardService.getStatusDistribution(resolveSupplierId()));
    }

    @GetMapping("/reports/delayed")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delayed Shipments Report", description = "Generates report of delayed shipments")
    public ResponseEntity<java.util.List<ShipmentTrackingResponse>> getDelayedShipments() {
        return ResponseEntity.ok(dashboardService.getDelayedShipmentsReport(resolveSupplierId()));
    }
}
