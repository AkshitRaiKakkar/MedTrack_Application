package com.medtrack.dto;

import com.medtrack.model.OperationsEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response DTO for operations events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationsEventResponse {

    private Long id;
    private OperationsEvent.EventCategory category;
    private OperationsEvent.EventType type;
    private String title;
    private String detail;
    private Long hospitalId;
    private Long entityId;
    private OperationsEvent.EntityType entityType;
    private String actor;
    private OperationsEvent.EventSeverity severity;
    private Boolean read;
    private LocalDateTime createdAt;
}