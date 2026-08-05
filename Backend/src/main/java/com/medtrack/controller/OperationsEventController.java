package com.medtrack.controller;

import com.medtrack.dto.EventReadRequest;
import com.medtrack.dto.OperationsEventResponse;
import com.medtrack.dto.UnreadCountResponse;
import com.medtrack.model.EventReadReceipt;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EventReadReceiptRepository;
import com.medtrack.repository.OperationsEventRepository;
import com.medtrack.service.EventPublisherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for operations events.
 * Provides event history, unread counts, and read receipt management.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class OperationsEventController {

    private final OperationsEventRepository eventRepository;
    private final EventReadReceiptRepository readReceiptRepository;
    private final EventPublisherService eventPublisherService;

    /**
     * Get paginated event history for the user's hospital.
     */
    @GetMapping
    public ResponseEntity<Page<OperationsEventResponse>> getEvents(
            @RequestParam(required = false) OperationsEvent.EventCategory category,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Long hospitalId = getHospitalId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        Page<OperationsEvent> events;
        if (unreadOnly != null && unreadOnly) {
            if (category != null) {
                events = eventRepository.findByHospitalIdAndCategoryAndReadFalseOrderByCreatedAtDesc(hospitalId, category, pageable);
            } else {
                events = eventRepository.findByHospitalIdAndReadFalseOrderByCreatedAtDesc(hospitalId, pageable);
            }
        } else if (category != null) {
            events = eventRepository.findByHospitalIdAndCategoryOrderByCreatedAtDesc(hospitalId, category, pageable);
        } else {
            events = eventRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable);
        }

        return ResponseEntity.ok(events.map(this::toResponse));
    }

    /**
     * Get unread event counts by category for the user's hospital.
     */
    @GetMapping("/unread-counts")
    public ResponseEntity<UnreadCountResponse> getUnreadCounts(Authentication authentication) {
        Long hospitalId = getHospitalId(authentication);
        Long userId = getUserId(authentication);

        // Count unread events per category
        Map<OperationsEvent.EventCategory, Long> counts = Map.ofEntries(
                Map.entry(OperationsEvent.EventCategory.MAINTENANCE,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.MAINTENANCE)),
                Map.entry(OperationsEvent.EventCategory.EQUIPMENT,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.EQUIPMENT)),
                Map.entry(OperationsEvent.EventCategory.PROCUREMENT,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.PROCUREMENT)),
                Map.entry(OperationsEvent.EventCategory.SHIPMENT,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.SHIPMENT)),
                Map.entry(OperationsEvent.EventCategory.APPROVAL,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.APPROVAL)),
                Map.entry(OperationsEvent.EventCategory.SLA,
                        eventRepository.countByHospitalIdAndCategoryAndReadFalse(hospitalId, OperationsEvent.EventCategory.SLA))
        );

        long total = counts.values().stream().mapToLong(Long::longValue).sum();

        return ResponseEntity.ok(new UnreadCountResponse(total, counts));
    }

    /**
     * Get recent events since a timestamp (for replay on reconnect).
     */
    @GetMapping("/recent")
    public ResponseEntity<List<OperationsEventResponse>> getRecentEvents(
            @RequestParam LocalDateTime since,
            Authentication authentication) {

        Long hospitalId = getHospitalId(authentication);
        List<OperationsEvent> events = eventRepository.findByHospitalIdAndCreatedAtAfterOrderByCreatedAtAsc(hospitalId, since);
        return ResponseEntity.ok(events.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    /**
     * Mark events as read.
     */
    @PostMapping("/read")
    public ResponseEntity<Void> markAsRead(@Valid @RequestBody EventReadRequest request, Authentication authentication) {
        Long userId = getUserId(authentication);
        Long hospitalId = getHospitalId(authentication);

        // Verify all events belong to user's hospital
        List<OperationsEvent> events = eventRepository.findAllById(request.getEventIds());
        for (OperationsEvent event : events) {
            if (!event.getHospitalId().equals(hospitalId)) {
                return ResponseEntity.badRequest().build();
            }
        }

        // Create read receipts
        List<EventReadReceipt> receipts = request.getEventIds().stream()
                .map(eventId -> EventReadReceipt.builder()
                        .eventId(eventId)
                        .userId(userId)
                        .build())
                .collect(Collectors.toList());
        readReceiptRepository.saveAll(receipts);

        return ResponseEntity.ok().build();
    }

    /**
     * Mark all events as read (up to a limit).
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam(defaultValue = "100") int limit, Authentication authentication) {
        Long userId = getUserId(authentication);
        Long hospitalId = getHospitalId(authentication);

        // Get unread event IDs for this hospital
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Order.desc("createdAt")));
        List<OperationsEvent> unreadEvents = eventRepository.findByHospitalIdAndReadFalseOrderByCreatedAtDesc(hospitalId, pageable).getContent();

        List<EventReadReceipt> receipts = unreadEvents.stream()
                .map(event -> EventReadReceipt.builder()
                        .eventId(event.getId())
                        .userId(userId)
                        .build())
                .collect(Collectors.toList());
        readReceiptRepository.saveAll(receipts);

        return ResponseEntity.ok().build();
    }

    private OperationsEventResponse toResponse(OperationsEvent event) {
        return OperationsEventResponse.builder()
                .id(event.getId())
                .category(event.getCategory())
                .type(event.getType())
                .title(event.getTitle())
                .detail(event.getDetail())
                .hospitalId(event.getHospitalId())
                .entityId(event.getEntityId())
                .entityType(event.getEntityType())
                .actor(event.getActor())
                .severity(event.getSeverity())
                .read(event.getRead())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private Long getHospitalId(Authentication authentication) {
        // In a real implementation, this would come from the user's hospital context
        // For now, extracting from principal or using a service
        return 1L; // Placeholder - should use HospitalAccessGuard or similar
    }

    private Long getUserId(Authentication authentication) {
        // Extract user ID from authentication
        return 1L; // Placeholder
    }
}