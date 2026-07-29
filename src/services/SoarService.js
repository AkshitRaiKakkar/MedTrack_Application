import API from "./HttpService";

// Get all configured SOAR playbooks
export const getAllPlaybooks = async () => {
  const response = await API.get("/api/auth/soar/playbooks");
  return response.data;
};

// Create a new SOAR playbook
export const createPlaybook = async (data) => {
  const response = await API.post("/api/auth/soar/playbooks", data);
  return response.data;
};

// Toggle SOAR playbook active status
export const togglePlaybookStatus = async (playbookId, active) => {
  const response = await API.put(`/api/auth/soar/playbooks/${playbookId}/toggle`, null, {
    params: { active }
  });
  return response.data;
};

// Trigger SOAR playbook execution against affected resource
export const triggerPlaybook = async (data) => {
  const response = await API.post("/api/auth/soar/execute", data);
  return response.data;
};

// Get all playbook execution logs
export const getAllExecutionLogs = async () => {
  const response = await API.get("/api/auth/soar/executions");
  return response.data;
};
