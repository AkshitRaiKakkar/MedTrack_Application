import API from "./HttpService";

// Get all microsegmentation isolation rules
export const getAllPolicies = async () => {
  const response = await API.get("/api/auth/microsegmentation/rules");
  return response.data;
};

// Create a new microsegmentation rule
export const createRule = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/rules", data);
  return response.data;
};

// Toggle microsegmentation rule active status
export const toggleRuleStatus = async (ruleId, active) => {
  const response = await API.put(`/api/auth/microsegmentation/rules/${ruleId}/toggle`, null, {
    params: { active }
  });
  return response.data;
};

// Get all SDP tunnel sessions
export const getAllTunnels = async () => {
  const response = await API.get("/api/auth/microsegmentation/tunnels");
  return response.data;
};

// Establish a Software-Defined Perimeter (SDP) tunnel
export const establishTunnel = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/tunnels/establish", data);
  return response.data;
};

// Terminate an active SDP tunnel
export const terminateTunnel = async (sessionId) => {
  const response = await API.put(`/api/auth/microsegmentation/tunnels/${sessionId}/terminate`);
  return response.data;
};
