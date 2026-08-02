package com.medtrack.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.model.OperationsEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * WebSocket handler for real-time operations events.
 * Manages subscriptions per hospital and broadcasts events to connected clients.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    // hospitalId -> set of sessions
    private final Map<Long, CopyOnWriteArraySet<WebSocketSession>> subscriptions = new ConcurrentHashMap<>();

    // session -> hospitalId (for cleanup on close)
    private final Map<WebSocketSession, Long> sessionHospital = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.debug("WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            SubscriptionMessage msg = objectMapper.readValue(payload, SubscriptionMessage.class);

            if ("subscribe".equals(msg.getAction())) {
                Long hospitalId = msg.getHospitalId();
                if (hospitalId != null) {
                    subscribe(session, hospitalId);
                    sendMessage(session, Map.of("type", "subscribed", "hospitalId", hospitalId));
                }
            } else if ("unsubscribe".equals(msg.getAction())) {
                Long hospitalId = sessionHospital.get(session);
                if (hospitalId != null) {
                    unsubscribe(session, hospitalId);
                }
            }
        } catch (Exception e) {
            log.warn("Error handling WebSocket message: {}", e.getMessage());
            sendMessage(session, Map.of("type", "error", "message", "Invalid message format"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long hospitalId = sessionHospital.remove(session);
        if (hospitalId != null) {
            unsubscribe(session, hospitalId);
        }
        log.debug("WebSocket connection closed: {} ({})", session.getId(), status);
    }

    private void subscribe(WebSocketSession session, Long hospitalId) {
        sessionHospital.put(session, hospitalId);
        subscriptions.computeIfAbsent(hospitalId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.debug("Session {} subscribed to hospital {}", session.getId(), hospitalId);
    }

    private void unsubscribe(WebSocketSession session, Long hospitalId) {
        CopyOnWriteArraySet<WebSocketSession> sessions = subscriptions.get(hospitalId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                subscriptions.remove(hospitalId);
            }
        }
        log.debug("Session {} unsubscribed from hospital {}", session.getId(), hospitalId);
    }

    /**
     * Broadcast an event to all subscribers of a hospital.
     */
    public void broadcastToHospital(Long hospitalId, OperationsEvent event) {
        CopyOnWriteArraySet<WebSocketSession> sessions = subscriptions.get(hospitalId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "event",
                    "event", event
            ));
            TextMessage message = new TextMessage(json);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        log.debug("Failed to send to session {}: {}", session.getId(), e.getMessage());
                        // Remove dead session
                        sessions.remove(session);
                        sessionHospital.remove(session);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting event: {}", e.getMessage());
        }
    }

    private void sendMessage(WebSocketSession session, Map<String, Object> payload) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(payload);
            session.sendMessage(new TextMessage(json));
        }
    }

    /**
     * Get count of active subscriptions for a hospital (for monitoring).
     */
    public int getSubscriptionCount(Long hospitalId) {
        CopyOnWriteArraySet<WebSocketSession> sessions = subscriptions.get(hospitalId);
        return sessions != null ? sessions.size() : 0;
    }

    // Internal message types
    public static class SubscriptionMessage {
        private String action;
        private Long hospitalId;

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }
    }
}