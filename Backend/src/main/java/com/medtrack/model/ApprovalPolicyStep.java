package com.medtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * A step within an {@link ApprovalPolicy}. Steps with the same {@code stepGroup} form a parallel
 * group (all must approve); different groups run sequentially. Each step names the required
 * approver role (e.g. {@code hospital}) and may pin a specific approver email.
 */
@Entity
@Table(name = "approval_policy_steps")
@SQLRestriction("deleted = false")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalPolicyStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "step_group", nullable = false)
    private Integer stepGroup;

    @Column(name = "approver_role", nullable = false, length = 50)
    private String approverRole;

    @Column(name = "approver_email", length = 255)
    private String approverEmail;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Soft delete fields - records are never hard deleted for audit compliance.
     */
    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    @Column(name = "deleted_by", length = 255)
    private String deletedBy;
}
