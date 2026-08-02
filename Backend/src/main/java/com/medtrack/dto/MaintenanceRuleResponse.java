package com.medtrack.dto;

import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.RecurrenceFrequency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * API-facing view of a preventive-maintenance rule. Entity fields are never serialized directly so
 * ownership keys stay internal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRuleResponse {

    private Long id;
    private String name;
    private String description;
    private MaintenanceRuleScope ruleScope;
    private EquipmentCategory equipmentCategory;
    private Long equipmentRecordId;
    private String equipmentName;
    private String manufacturer;
    private String priority;
    private RecurrenceFrequency frequency;
    private Integer customIntervalDays;
    private String maintenanceType;
    private Integer slaWarningDays;
    private Integer slaBreachDays;
    private Integer leadTimeDays;
    private Boolean active;
    private LocalDate lastGeneratedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaintenanceRuleResponse from(MaintenancePolicyRule rule, String equipmentName) {
        return MaintenanceRuleResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .description(rule.getDescription())
                .ruleScope(rule.getRuleScope())
                .equipmentCategory(rule.getEquipmentCategory())
                .equipmentRecordId(rule.getEquipmentRecordId())
                .equipmentName(equipmentName)
                .manufacturer(rule.getManufacturer())
                .priority(rule.getPriority())
                .frequency(rule.getFrequency())
                .customIntervalDays(rule.getCustomIntervalDays())
                .maintenanceType(rule.getMaintenanceType())
                .slaWarningDays(rule.getSlaWarningDays())
                .slaBreachDays(rule.getSlaBreachDays())
                .leadTimeDays(rule.getLeadTimeDays())
                .active(rule.getActive())
                .lastGeneratedAt(rule.getLastGeneratedAt())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
