import API from "./HttpService";
import { errorEmitter } from "./HttpService";

const BASE = "/api/events";

// ---- REST API ----

export const getEvents = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.unreadOnly) searchParams.set("unreadOnly", "true");
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 20));
  const response = await API.get(`${BASE}?${searchParams.toString()}`);
  return response.data;
};

export const getUnreadCounts = async () => {
  const response = await API.get(`${BASE}/unread-counts`);
  return response.data;
};

export const getRecentEvents = async (since) => {
  const response = await API.get(`${BASE}/recent?since=${encodeURIComponent(since)}`);
  return response.data;
};

export const markEventsAsRead = async (eventIds) => {
  const response = await API.post(`${BASE}/read`, { eventIds });
  return response.data;
};

export const markAllEventsAsRead = async (limit = 100) => {
  const response = await API.post(`${BASE}/read-all?limit=${limit}`);
  return response.data;
};

// ---- WebSocket Client ----

class EventStreamClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.hospitalId = null;
    this.eventHandlers = new Set();
    this.connectionHandlers = new Set();
    this.reconnectTimer = null;
    this.manuallyClosed = false;
  }

  connect(hospitalId, token) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (this.hospitalId === hospitalId) return;
      this.disconnect();
    }

    this.hospitalId = hospitalId;
    this.manuallyClosed = false;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${BASE}/stream`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[EventStream] Connected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyConnection(true);
      // Subscribe to hospital events
      this.send({ action: "subscribe", hospitalId });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "event" && msg.event) {
          this.notifyEvent(msg.event);
        }
      } catch (e) {
        console.warn("[EventStream] Failed to parse message:", e);
      }
    };

    this.ws.onclose = () => {
      console.log("[EventStream] Disconnected");
      this.notifyConnection(false);
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error("[EventStream] Error:", err);
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[EventStream] Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    console.log(`[EventStream] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      if (this.hospitalId) {
        const saved = sessionStorage.getItem("medtrack_user");
        if (saved) {
          try {
            const user = JSON.parse(saved);
            if (user?.token) this.connect(this.hospitalId, user.token);
          } catch (e) {
            // ignore
          }
        }
      }
    }, this.reconnectDelay);
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.hospitalId = null;
    this.notifyConnection(false);
  }

  onEvent(handler) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onConnectionChange(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  notifyEvent(event) {
    this.eventHandlers.forEach(h => h(event));
  }

  notifyConnection(connected) {
    this.connectionHandlers.forEach(h => h(connected));
  }

  send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const eventStream = new EventStreamClient();

// Initialize from session storage on load
if (typeof window !== "undefined") {
  try {
    const saved = sessionStorage.getItem("medtrack_user");
    if (saved) {
      const user = JSON.parse(saved);
      if (user?.token && user?.role === "hospital") {
        // We'll connect when the activity center mounts
      }
    }
  } catch (e) {
    // ignore
  }
}