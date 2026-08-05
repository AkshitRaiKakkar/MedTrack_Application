package com.medtrack.dto;

import com.medtrack.model.OperationsEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for unread event counts by category.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadCountResponse {

    private Long total;
    private Map<OperationsEvent.EventCategory, Long> byCategory;
}