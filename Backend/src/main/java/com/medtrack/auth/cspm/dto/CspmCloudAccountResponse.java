package com.medtrack.auth.cspm.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CspmCloudAccountResponse {
    private Long id;
    private String accountNumber;
    private String provider;
    private String accountName;
    private String region;
    private String syncStatus;
    private LocalDateTime createdAt;
    private LocalDateTime lastSyncedAt;
}
