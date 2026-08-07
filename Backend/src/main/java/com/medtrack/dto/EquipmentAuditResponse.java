package com.medtrack.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentAuditResponse {

    private Long id;

    private Long equipmentId;

    private String username;

    private String action;

    private String changedFields;

    private String previousValue;

    private String newValue;

    private LocalDateTime timestamp;
}