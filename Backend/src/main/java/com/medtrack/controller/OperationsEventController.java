package com.medtrack.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EventReadRequest;
import com.medtrack.dto.OperationsEventResponse;
import com.medtrack.dto.UnreadCountResponse;
import com.medtrack.model.EventReadReceipt;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EventReadReceiptRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.NotificationPreferenceRepository;
import com.medtrack.repository.OperationsEventRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    /**
     * Get paginated event history for the user's hospital.
     *
     * <p>Muted categories are excluded from the unfiltered ("All") view, but remain reachable by
     * requesting that category explicitly - muting quiets the default feed, it does not delete
     * access to the data.</p>
     */
    @GetMapping
    public ResponseEntity<Page<OperationsEventResponse>> getEvents(
            @RequestParam(required = false) OperationsEvent.EventCategory category,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Long hospitalId = getHospitalId(authentication);
        Long userId = getUserId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        Set<OperationsEvent.EventCategory> muted = category == null
                ? preferenceRepository.mutedCategoriesFor(userId)
                : Set.of();

        Page<OperationsEvent> events;
        if (unreadOnly != null && unreadOnly) {
            if (category != null) {
                events = eventRepository.findUnreadForUserByCategory(hospitalId, category, userId, pageable);
            } else if (!muted.isEmpty()) {
                events = eventRepository.findUnreadForUserExcludingCategories(hospitalId, muted, userId, pageable);
            } else {
                events = eventRepository.findUnreadForUser(hospitalId, userId, pageable);
            }
        } else if (category != null) {
            events = eventRepository.findByHospitalIdAndCategoryOrderByCreatedAtDesc(hospitalId, category, pageable);
        } else if (!muted.isEmpty()) {
            events = eventRepository.findByHospitalIdExcludingCategories(hospitalId, muted, pageable);
        } else {
            events = eventRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable);
        }

        Set<Long> readEventIds = readEventIdsFor(userId, events.getContent());
        return ResponseEntity.ok(events.map(event -> toResponse(event, readEventIds)));
    }

    /**
     * Get unread event counts by category for the user's hospital. Muted categories are
     * reported as zero so the notification bell badge reflects what the user actually wants
     * to see.
     */
    @GetMapping("/unread-counts")
    public ResponseEntity<UnreadCountResponse> getUnreadCounts(Authentication authentication) {
        Long hospitalId = getHospitalId(authentication);
        Long userId = getUserId(authentication);
        Set<OperationsEvent.EventCategory> muted = preferenceRepository.mutedCategoriesFor(userId);

        Map<OperationsEvent.EventCategory, Long> counts = new EnumMap<>(OperationsEvent.EventCategory.class);
        for (OperationsEvent.EventCategory eventCategory : OperationsEvent.EventCategory.values()) {
            long count = muted.contains(eventCategory)
                    ? 0L
                    : eventRepository.countUnreadForUserByCategory(hospitalId, eventCategory, userId);
            counts.put(eventCategory, count);
        }

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
        Long userId = getUserId(authentication);
        List<OperationsEvent> events = eventRepository.findByHospitalIdAndCreatedAtAfterOrderByCreatedAtAsc(hospitalId, since);
        Set<Long> readEventIds = readEventIdsFor(userId, events);
        return ResponseEntity.ok(events.stream().map(event -> toResponse(event, readEventIds)).collect(Collectors.toList()));
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

        saveNewReceipts(userId, request.getEventIds());

        return ResponseEntity.ok().build();
    }

    /**
     * Mark all events as read (up to a limit).
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam(defaultValue = "100") int limit, Authentication authentication) {
        Long userId = getUserId(authentication);
        Long hospitalId = getHospitalId(authentication);

        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Order.desc("createdAt")));
        List<OperationsEvent> unreadEvents = eventRepository.findUnreadForUser(hospitalId, userId, pageable).getContent();

        saveNewReceipts(userId, unreadEvents.stream().map(OperationsEvent::getId).collect(Collectors.toList()));

        return ResponseEntity.ok().build();
    }

    /**
     * Inserts a read receipt for each event id not already read by this user. The
     * {@code (event_id, user_id)} unique constraint means a duplicate insert would otherwise
     * fail if the same event were marked read twice (e.g. two browser tabs).
     */
    private void saveNewReceipts(Long userId, List<Long> eventIds) {
        if (eventIds.isEmpty()) {
            return;
        }
        Set<Long> existing = readReceiptRepository.findByUserIdAndEventIdIn(userId, eventIds).stream()
                .map(EventReadReceipt::getEventId)
                .collect(Collectors.toSet());
        List<EventReadReceipt> receipts = eventIds.stream()
                .filter(eventId -> !existing.contains(eventId))
                .map(eventId -> EventReadReceipt.builder()
                        .eventId(eventId)
                        .userId(userId)
                        .build())
                .collect(Collectors.toList());
        readReceiptRepository.saveAll(receipts);
    }

    private Set<Long> readEventIdsFor(Long userId, List<OperationsEvent> events) {
        if (events.isEmpty()) {
            return Set.of();
        }
        List<Long> eventIds = events.stream().map(OperationsEvent::getId).collect(Collectors.toList());
        return readReceiptRepository.findByUserIdAndEventIdIn(userId, eventIds).stream()
                .map(EventReadReceipt::getEventId)
                .collect(Collectors.toSet());
    }

    private OperationsEventResponse toResponse(OperationsEvent event, Set<Long> readEventIds) {
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
                .read(readEventIds.contains(event.getId()))
                .createdAt(event.getCreatedAt())
                .build();
    }

    /**
     * Resolves the caller's hospital from their authenticated account. Only hospital-role
     * accounts use the Activity Center today.
     */
    private Long getHospitalId(Authentication authentication) {
        Hospital hospital = hospitalRepository.findByUserId(getAuthenticatedUser(authentication).getId())
                .orElseThrow(() -> new AccessDeniedException("An active hospital account is required"));
        return hospital.getId();
    }

    private Long getUserId(Authentication authentication) {
        return getAuthenticatedUser(authentication).getId();
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("An authenticated account is required");
        }
        String normalizedEmail = authentication.getName().trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AccessDeniedException("An authenticated account is required"));
    }
}
