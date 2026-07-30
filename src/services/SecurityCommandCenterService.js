import API from "./HttpService";

// Get unified security summary metrics across all subsystems
export const getUnifiedSummary = async () => {
  const response = await API.get("/api/auth/commandcenter/summary");
  return response.data;
};

// Get active security command center dashboard config
export const getActiveConfig = async () => {
  const response = await API.get("/api/auth/commandcenter/config");
  return response.data;
};

// Update dashboard configuration and active widgets
export const updateConfig = async (data) => {
  const response = await API.put("/api/auth/commandcenter/config", data);
  return response.data;
};

// Acknowledge a system-wide unified security alert
export const acknowledgeAlert = async (data) => {
  const response = await API.post("/api/auth/commandcenter/alerts/acknowledge", data);
  return response.data;
};

// Get all system-wide unified alerts
export const getAllAlerts = async () => {
  const response = await API.get("/api/auth/commandcenter/alerts");
  return response.data;
};
