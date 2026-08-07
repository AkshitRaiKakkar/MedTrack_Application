package com.medtrack.dto;

import com.medtrack.model.TenderAuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Immutable audit entry for a tender: who did what, when, and why.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderAuditLogResponse {

    private Long id;
    private Long tenderId;
    private String actor;
    private String action;
    private String detail;
    private LocalDateTime createdAt;

    public static TenderAuditLogResponse from(TenderAuditLog log) {
        return TenderAuditLogResponse.builder()
                .id(log.getId())
                .tenderId(log.getTenderId())
                .actor(log.getActor())
                .action(log.getAction())
                .detail(log.getDetail())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
