import API from "./HttpService";

// Get active SAML 2.0 Identity Provider configuration
export const getActiveConfig = async () => {
  const response = await API.get("/api/auth/saml/config");
  return response.data;
};

// Update SAML 2.0 Identity Provider configuration
export const updateConfig = async (data) => {
  const response = await API.put("/api/auth/saml/config", data);
  return response.data;
};

// Process and validate incoming SAML 2.0 XML assertion
export const processSamlAssertion = async (data) => {
  const response = await API.post("/api/auth/saml/assertion/process", data);
  return response.data;
};

// Get all validated SAML SSO session logs
export const getAllSessionLogs = async () => {
  const response = await API.get("/api/auth/saml/sessions");
  return response.data;
};
