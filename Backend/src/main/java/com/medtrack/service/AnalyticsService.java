package com.medtrack.service;

import com.medtrack.dto.HospitalAnalyticsDto;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceTaskRepository taskRepository;
    private final EquipmentOrderRepository orderRepository;
    private final HospitalRepository hospitalRepository;

    public HospitalAnalyticsDto getHospitalAnalytics(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id: " + hospitalId));

        // 1. Downtime Percentage — database-level aggregation
        long totalEquipment = equipmentRepository.countByHospitalId(hospitalId);
        long underMaintenanceCount = equipmentRepository.countByHospitalIdAndStatus(
                hospitalId, EquipmentStatus.UNDER_MAINTENANCE);
        double downtimePercentage = totalEquipment > 0
                ? (underMaintenanceCount * 100.0) / totalEquipment
                : 0.0;

        // 2. Upcoming Warranty Expirations (within next 30 days) — database-level
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        long upcomingWarrantyCount = equipmentRepository.countByHospitalIdAndWarrantyExpiryBetween(
                hospitalId, today, limit);

        // 3. Maintenance SLA compliance — load only measurable completed tasks
        List<MaintenanceTask> measurableTasks = taskRepository.findCompletedTasksWithTimestamps(
                hospitalId, MaintenanceStatus.COMPLETED);
        long compliantCount = measurableTasks.stream()
                .filter(task -> !task.getCompletedAt().toLocalDate().isAfter(task.getDeadline()))
                .count();
        double slaCompliance = measurableTasks.isEmpty()
                ? 100.0
                : (compliantCount * 100.0) / measurableTasks.size();

        // MTTR — database-level AVG
        Double avgHours = taskRepository.averageHoursWorkedByHospitalIdAndStatus(
                hospitalId, MaintenanceStatus.COMPLETED);
        double mttr = avgHours != null ? avgHours : 0.0;

        // 4. Critical Pending Count — database-level aggregation
        long criticalPending = taskRepository.countByHospitalIdAndStatusNotAndPriority(
                hospitalId, MaintenanceStatus.COMPLETED, "Critical");

        // 5. Total Spend & Category Spend — DB-level filtered orders + lightweight category mapping
        String hospitalName = hospital.getName();
        BigDecimal totalSpend = orderRepository.sumTotalCostByHospitalAndShippingStatus(
                hospitalName, "Delivered");
        if (totalSpend == null) totalSpend = BigDecimal.ZERO;

        List<EquipmentOrder> deliveredOrders = orderRepository.findByHospitalAndShippingStatus(
                hospitalName, "Delivered");

        List<Object[]> nameCategoryPairs = equipmentRepository.findNameAndCategoryByHospitalId(hospitalId);
        Map<String, String> equipmentCategoryMap = new HashMap<>();
        for (Object[] pair : nameCategoryPairs) {
            String name = (String) pair[0];
            EquipmentCategory category = (EquipmentCategory) pair[1];
            if (name != null && category != null) {
                equipmentCategoryMap.put(name.toLowerCase(), category.name());
            }
        }

        Map<String, BigDecimal> spendByCategory = new HashMap<>();
        for (EquipmentOrder order : deliveredOrders) {
            BigDecimal cost = order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO;
            String category = resolveCategory(order, equipmentCategoryMap);
            spendByCategory.put(category, spendByCategory.getOrDefault(category, BigDecimal.ZERO).add(cost));
        }

        return HospitalAnalyticsDto.builder()
                .totalSpend(totalSpend)
                .spendByCategory(spendByCategory)
                .slaComplianceRate(slaCompliance)
                .meanTimeToRepairHours(mttr)
                .criticalFailingAssetsCount(criticalPending)
                .downtimePercentage(downtimePercentage)
                .upcomingWarrantyExpirationsCount(upcomingWarrantyCount)
                .build();
    }

    private String resolveCategory(EquipmentOrder order, Map<String, String> equipmentCategoryMap) {
        String eqName = order.getEquipmentName();
        if (eqName != null) {
            String category = equipmentCategoryMap.get(eqName.toLowerCase());
            if (category != null) return category;
        }

        // The heuristic fallback below must speak the same vocabulary as the lookup above, which
        // returns EquipmentCategory.name(). It previously returned Title-Case strings, so the key a
        // caller saw depended on whether the order's equipmentName happened to match a registered
        // asset: the same category could appear as both "IMAGING" and "Imaging" in one response, and
        // a dashboard keying on either would silently miss half the spend.
        if (eqName == null) return EquipmentCategory.OTHER.name();
        String lower = eqName.toLowerCase();
        if (lower.contains("mri") || lower.contains("scan") || lower.contains("imaging")) {
            return EquipmentCategory.IMAGING.name();
        }
        if (lower.contains("pump") || lower.contains("monitor")) {
            return EquipmentCategory.MONITORING.name();
        }
        if (lower.contains("ventilator") || lower.contains("respiratory")) {
            return EquipmentCategory.RESPIRATORY.name();
        }
        if (lower.contains("laser") || lower.contains("surgical")) {
            return EquipmentCategory.SURGICAL.name();
        }
        return EquipmentCategory.OTHER.name();
    }
}
