package com.medtrack.supplier.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.supplier.dto.*;
import com.medtrack.supplier.service.DashboardService;
import com.medtrack.supplier.service.prediction.PredictionService;
import com.medtrack.supplier.service.prediction.RecommendationService;
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
    private final PredictionService predictionService;
    private final RecommendationService recommendationService;
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

    // Phase 15: Predictive Analytics Endpoints

    @GetMapping("/prediction/daily")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Daily Forecast", description = "Generates daily shipment volume forecast")
    public ResponseEntity<PredictionDTO> getDailyForecast() {
        return ResponseEntity.ok(predictionService.getDailyForecast(resolveSupplierId()));
    }

    @GetMapping("/prediction/weekly")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Weekly Forecast", description = "Generates weekly shipment volume forecast")
    public ResponseEntity<PredictionDTO> getWeeklyForecast() {
        return ResponseEntity.ok(predictionService.getWeeklyForecast(resolveSupplierId()));
    }

    @GetMapping("/prediction/delay-probability")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Delay Probability", description = "Calculates overall delay probability for the supplier")
    public ResponseEntity<PredictionDTO> getDelayProbability() {
        return ResponseEntity.ok(predictionService.getDelayProbability(resolveSupplierId()));
    }

    @GetMapping("/risk-analysis/{orderId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Shipment Risk Analysis", description = "Analyzes risk level for a specific shipment")
    public ResponseEntity<ShipmentRiskDTO> getRiskAnalysis(
            @org.springframework.web.bind.annotation.PathVariable Long orderId) {
        return ResponseEntity.ok(predictionService.calculateShipmentRisk(resolveSupplierId(), orderId));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Performance Trends", description = "Yields historical analytic trends")
    public ResponseEntity<TrendAnalysisDTO> getPerformanceTrends() {
        return ResponseEntity.ok(predictionService.getTrendAnalysis(resolveSupplierId()));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get Smart Recommendations", description = "Generates system recommendations for operational improvement")
    public ResponseEntity<java.util.List<RecommendationDTO>> getRecommendations() {
        return ResponseEntity.ok(recommendationService.getRecommendations(resolveSupplierId()));
    }
}
