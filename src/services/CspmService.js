import API from "./HttpService";

// Get all connected cloud accounts
export const getAllAccounts = async () => {
  const response = await API.get("/api/auth/cspm/accounts");
  return response.data;
};

// Register a new connected cloud account
export const registerCloudAccount = async (data) => {
  const response = await API.post("/api/auth/cspm/accounts", data);
  return response.data;
};

// Get all CSPM security findings & misconfigurations
export const getAllFindings = async () => {
  const response = await API.get("/api/auth/cspm/findings");
  return response.data;
};

// Ingest a new CSPM finding
export const ingestFinding = async (data) => {
  const response = await API.post("/api/auth/cspm/findings/ingest", data);
  return response.data;
};

// Trigger automated CLI/Terraform remediation for finding
export const remediateFinding = async (findingId) => {
  const response = await API.put(`/api/auth/cspm/findings/${findingId}/remediate`);
  return response.data;
};
