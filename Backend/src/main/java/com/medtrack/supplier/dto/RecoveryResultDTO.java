package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryResultDTO {
    private Long operationId;
    private String operationType;
    private boolean successful;
    private String message;
    private int retryCountAfterRecovery;
}
