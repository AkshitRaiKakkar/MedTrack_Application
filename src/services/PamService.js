import API from "./HttpService";

// Get active PAM policy configuration
export const getActivePolicy = async () => {
  const response = await API.get("/api/auth/pam/policy");
  return response.data;
};

// Update PAM policy configuration
export const updatePolicy = async (data) => {
  const response = await API.put("/api/auth/pam/policy", data);
  return response.data;
};

// Submit a new JIT Privileged Access Request
export const createAccessRequest = async (data) => {
  const response = await API.post("/api/auth/pam/request", data);
  return response.data;
};

// Approve a pending JIT Access Request
export const approveRequest = async (requestId) => {
  const response = await API.put(`/api/auth/pam/request/${requestId}/approve`);
  return response.data;
};

// Record command execution log in active PAM session
export const recordSessionLog = async (data) => {
  const response = await API.post("/api/auth/pam/session/log", data);
  return response.data;
};

// Get all JIT access requests
export const getAllRequests = async () => {
  const response = await API.get("/api/auth/pam/requests");
  return response.data;
};

// Get all PAM session command logs
export const getAllSessionLogs = async () => {
  const response = await API.get("/api/auth/pam/session/logs");
  return response.data;
};
