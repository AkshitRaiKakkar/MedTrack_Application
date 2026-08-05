package com.medtrack.service;

import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.OperationsEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for publishing operations events.
 * Other services call this to emit events when state changes occur.
 */
@Service
@RequiredArgsConstructor
public class EventPublisherService {

    private final OperationsEventRepository eventRepository;
    private final EventWebSocketHandler webSocketHandler;

    /**
     * Publish a new event and broadcast to connected WebSocket clients.
     */
    @Transactional
    public OperationsEvent publishEvent(OperationsEvent event) {
        OperationsEvent saved = eventRepository.save(event);
        // Broadcast to WebSocket subscribers
        // ponytail: broadcast is hospital-wide and does not consult NotificationPreference, since
        // EventWebSocketHandler tracks subscribers by hospitalId only, not userId - a muted user
        // still receives the live push. Mute is enforced in OperationsEventController's REST feed
        // and unread-counts (what ActivityCenter actually renders and polls every 30s), so the
        // gap self-corrects quickly. Upgrade path if a muted push turns out to matter: track
        // (session -> userId) in EventWebSocketHandler and filter broadcastToHospital per session.
        webSocketHandler.broadcastToHospital(event.getHospitalId(), saved);
        return saved;
    }

    /**
     * Convenience method for common event publishing.
     */
    @Transactional
    public OperationsEvent publishEvent(Long hospitalId,
                                        OperationsEvent.EventCategory category,
                                        OperationsEvent.EventType type,
                                        String title,
                                        String detail,
                                        Long entityId,
                                        OperationsEvent.EntityType entityType,
                                        String actor,
                                        OperationsEvent.EventSeverity severity) {
        OperationsEvent event = OperationsEvent.builder()
                .category(category)
                .type(type)
                .title(title)
                .detail(detail)
                .hospitalId(hospitalId)
                .entityId(entityId)
                .entityType(entityType)
                .actor(actor)
                .severity(severity)
                .build();
        return publishEvent(event);
    }

    /**
     * Get recent events for a hospital (for replay on reconnect).
     */
    @Transactional(readOnly = true)
    public List<OperationsEvent> getRecentEvents(Long hospitalId, LocalDateTime since) {
        return eventRepository.findByHospitalIdAndCreatedAtAfterOrderByCreatedAtAsc(hospitalId, since);
    }
}