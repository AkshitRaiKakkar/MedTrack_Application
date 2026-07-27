import API from "./HttpService";

// Get active threat intel feed configuration
export const getActiveFeedConfig = async () => {
  const response = await API.get("/api/auth/threatintel/config");
  return response.data;
};

// Update threat intel feed configuration
export const updateFeedConfig = async (data) => {
  const response = await API.put("/api/auth/threatintel/config", data);
  return response.data;
};

// Ingest a new Threat Indicator of Compromise (IOC)
export const ingestIndicator = async (data) => {
  const response = await API.post("/api/auth/threatintel/ioc/ingest", data);
  return response.data;
};

// Trigger firewall/WAF mitigation block action
export const triggerMitigation = async (data) => {
  const response = await API.post("/api/auth/threatintel/mitigate/trigger", data);
  return response.data;
};

// Get all ingested threat indicators
export const getAllIndicators = async () => {
  const response = await API.get("/api/auth/threatintel/ioc");
  return response.data;
};

// Get all firewall mitigation logs
export const getAllMitigationLogs = async () => {
  const response = await API.get("/api/auth/threatintel/mitigate/logs");
  return response.data;
};
