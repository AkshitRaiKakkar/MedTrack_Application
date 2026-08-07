package com.medtrack.service;

import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentAudit;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentAuditService {

    private final EquipmentAuditRepository equipmentAuditRepository;

    public void logAction(
            Equipment equipment,
            Hospital hospital,
            String username,
            String action,
            String changedFields,
            String previousValue,
            String newValue
    ) {

        EquipmentAudit audit = EquipmentAudit.builder()
                .equipmentId(equipment.getId())
                .hospital(hospital)
                .username(username)
                .action(action)
                .changedFields(changedFields)
                .previousValue(previousValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .build();

        equipmentAuditRepository.save(audit);
    }

    public List<EquipmentAuditResponse> getEquipmentHistory(Long equipmentId) {

        return equipmentAuditRepository
                .findByEquipmentIdOrderByTimestampDesc(equipmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EquipmentAuditResponse> getHospitalHistory(Long hospitalId) {

        return equipmentAuditRepository
                .findByHospitalIdOrderByTimestampDesc(hospitalId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private EquipmentAuditResponse mapToResponse(EquipmentAudit audit) {

        return EquipmentAuditResponse.builder()
                .id(audit.getId())
                .equipmentId(audit.getEquipmentId())
                .username(audit.getUsername())
                .action(audit.getAction())
                .changedFields(audit.getChangedFields())
                .previousValue(audit.getPreviousValue())
                .newValue(audit.getNewValue())
                .timestamp(audit.getTimestamp())
                .build();
    }
}