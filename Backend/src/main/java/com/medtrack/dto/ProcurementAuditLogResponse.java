package com.medtrack.dto;

import com.medtrack.model.ProcurementAuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementAuditLogResponse {

    private Long id;
    private Long requestId;
    private Long hospitalId;
    private String actor;
    private String action;
    private String detail;
    private LocalDateTime createdAt;

    public static ProcurementAuditLogResponse from(ProcurementAuditLog log) {
        return ProcurementAuditLogResponse.builder()
                .id(log.getId())
                .requestId(log.getRequestId())
                .hospitalId(log.getHospitalId())
                .actor(log.getActor())
                .action(log.getAction())
                .detail(log.getDetail())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
