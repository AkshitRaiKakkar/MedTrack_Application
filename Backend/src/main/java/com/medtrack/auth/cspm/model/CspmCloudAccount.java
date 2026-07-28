package com.medtrack.auth.cspm.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing connected Multi-Cloud Infrastructure Accounts (AWS, Azure, GCP).
 */
@Entity
@Table(name = "cspm_cloud_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CspmCloudAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String accountNumber; // e.g., AWS-19203910

    @Column(nullable = false)
    private String provider; // AWS, AZURE, GCP

    @Column(nullable = false)
    private String accountName; // Production-Medical-Infrastructure

    @Column(nullable = false)
    private String region; // us-west-2, eastus2, europe-west1

    @Column(nullable = false)
    private String syncStatus; // ACTIVE, ERROR, SYNCING

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastSyncedAt;
}
