package com.medtrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Per-user read receipt for operations events.
 * Allows tracking which users have read which events.
 */
@Entity
@Table(name = "event_read_receipts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventReadReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "read_at", nullable = false, updatable = false)
    private LocalDateTime readAt;
}