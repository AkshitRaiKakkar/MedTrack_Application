package com.medtrack.dto;

import com.medtrack.model.MaintenanceActivityType;
import com.medtrack.model.MaintenanceStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Safe, immutable projection of a maintenance activity record.
 * Work notes, parts text, and signatures are never copied into audit responses.
 */
@Value
@Builder
public class MaintenanceActivityResponse {
    Long id;
    Long taskId;
    Long sequenceNumber;
    MaintenanceActivityType eventType;
    Long actorUserId;
    String actorEmail;
    String actorRole;
    MaintenanceStatus previousStatus;
    MaintenanceStatus newStatus;
    String previousAssignee;
    String newAssignee;
    List<String> changedFields;
    String summary;
    LocalDateTime occurredAt;
}
