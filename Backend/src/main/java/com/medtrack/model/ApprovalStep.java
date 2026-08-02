package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A per-request approval step, materialized from the governing {@link ApprovalPolicy}'s steps at
 * request time so later policy edits never rewrite the audit trail of an in-flight request.
 */
@Entity
@Table(name = "approval_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    @Column(name = "step_group", nullable = false)
    private Integer stepGroup;

    @Column(name = "approver_role", nullable = false, length = 50)
    private String approverRole;

    @Column(name = "approver_email", length = 255)
    private String approverEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApprovalStepStatus status = ApprovalStepStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "decided_by", length = 255)
    private String decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
