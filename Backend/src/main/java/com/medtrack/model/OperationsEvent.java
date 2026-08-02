package com.medtrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Real-time operations event for maintenance, orders, shipments, approvals, and SLA.
 * Persisted for recent activity replay and missed-event recovery.
 */
@Entity
@Table(name = "operations_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Event category: MAINTENANCE, EQUIPMENT, PROCUREMENT, SHIPMENT, APPROVAL, SLA
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EventCategory category;

    /**
     * Specific event type within category.
     * e.g. MAINTENANCE.ASSIGNED, ORDER.STATUS_CHANGED, SHIPMENT.DELAYED, APPROVAL.REQUESTED, SLA.BREACHED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private EventType type;

    /**
     * Human-readable title for UI display.
     */
    @Column(nullable = false, length = 256)
    private String title;

    /**
     * Detailed description/payload (JSON or plain text).
     */
    @Column(columnDefinition = "TEXT")
    private String detail;

    /**
     * Hospital ID this event belongs to (for scoping).
     */
    @Column(name = "hospital_id", nullable = false)
    private Long hospitalId;

    /**
     * Optional: specific entity ID this event relates to (task ID, order ID, etc.)
     */
    private Long entityId;

    /**
     * Optional: entity type (MAINTENANCE_TASK, EQUIPMENT_ORDER, EQUIPMENT, SHIPMENT, PROCUREMENT_REQUEST)
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private EntityType entityType;

    /**
     * Actor who triggered the event (email or system).
     */
    @Column(length = 255)
    private String actor;

    /**
     * Event severity for UI prioritization.
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EventSeverity severity = EventSeverity.INFO;

    /**
     * Whether this event has been read by the recipient.
     * For system-wide events, this is per-user (see EventReadReceipt).
     */
    @Builder.Default
    private Boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum EventCategory {
        MAINTENANCE,
        EQUIPMENT,
        PROCUREMENT,
        SHIPMENT,
        APPROVAL,
        SLA
    }

    public enum EventType {
        // Maintenance
        MAINTENANCE_ASSIGNED,
        MAINTENANCE_STARTED,
        MAINTENANCE_COMPLETED,
        MAINTENANCE_OVERDUE,
        MAINTENANCE_RECURRENCE_CREATED,

        // Equipment
        EQUIPMENT_CREATED,
        EQUIPMENT_UPDATED,
        EQUIPMENT_ARCHIVED,
        EQUIPMENT_LOW_STOCK,
        EQUIPMENT_WARRANTY_EXPIRING,

        // Procurement
        PROCUREMENT_REQUEST_CREATED,
        PROCUREMENT_REQUEST_APPROVED,
        PROCUREMENT_REQUEST_REJECTED,
        PROCUREMENT_QUOTE_SUBMITTED,
        PROCUREMENT_QUOTE_ACCEPTED,
        PROCUREMENT_ORDER_CREATED,
        PROCUREMENT_RECEIVING_RECORDED,
        PROCUREMENT_INVOICE_MATCHED,

        // Shipment
        SHIPMENT_CREATED,
        SHIPMENT_STATUS_UPDATED,
        SHIPMENT_DELAYED,
        SHIPMENT_DELIVERED,

        // Approval
        APPROVAL_REQUESTED,
        APPROVAL_APPROVED,
        APPROVAL_REJECTED,
        APPROVAL_ESCALATED,

        // SLA
        SLA_WARNING,
        SLA_BREACHED,
        SLA_ESCALATED
    }

    public enum EntityType {
        MAINTENANCE_TASK,
        EQUIPMENT,
        EQUIPMENT_ORDER,
        SHIPMENT,
        PROCUREMENT_REQUEST,
        APPROVAL_STEP,
        APPROVAL_POLICY
    }

    public enum EventSeverity {
        INFO,
        WARNING,
        CRITICAL
    }
}