import API from "./HttpService";

// Get active compliance reporting template configuration
export const getActiveConfig = async () => {
  const response = await API.get("/api/auth/reporting/config");
  return response.data;
};

// Update compliance reporting template configuration
export const updateConfig = async (data) => {
  const response = await API.put("/api/auth/reporting/config", data);
  return response.data;
};

// Generate a new executive compliance audit report export
export const generateComplianceReport = async (data) => {
  const response = await API.post("/api/auth/reporting/generate", data);
  return response.data;
};

// Get all generated compliance report export logs
export const getAllReportLogs = async () => {
  const response = await API.get("/api/auth/reporting/exports");
  return response.data;
};
