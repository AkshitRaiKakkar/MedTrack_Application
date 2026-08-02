import API from "./HttpService";

// ---- Requests ----

export const createProcurementRequest = async (data) => {
  const response = await API.post("/api/procurement/requests", data);
  return response.data;
};

export const listProcurementRequests = async (status = null) => {
  const url = status ? `/api/procurement/requests?status=${status}` : "/api/procurement/requests";
  const response = await API.get(url);
  return response.data;
};

export const getProcurementRequest = async (id) => {
  const response = await API.get(`/api/procurement/requests/${id}`);
  return response.data;
};

export const cancelProcurementRequest = async (id) => {
  const response = await API.post(`/api/procurement/requests/${id}/cancel`);
  return response.data;
};

// ---- Approval Steps ----

export const decideApprovalStep = async (stepId, decision, comment = "") => {
  const response = await API.post(`/api/procurement/steps/${stepId}/decision`, { approve: decision, comment });
  return response.data;
};

export const getApprovalInbox = async () => {
  const response = await API.get("/api/procurement/approval-inbox");
  return response.data;
};

// ---- Approval Policies ----

export const listApprovalPolicies = async () => {
  const response = await API.get("/api/procurement/policies");
  return response.data;
};

export const createApprovalPolicy = async (data) => {
  const response = await API.post("/api/procurement/policies", data);
  return response.data;
};

export const updateApprovalPolicy = async (id, data) => {
  const response = await API.put(`/api/procurement/policies/${id}`, data);
  return response.data;
};

export const addPolicyStep = async (id, data) => {
  const response = await API.post(`/api/procurement/policies/${id}/steps`, data);
  return response.data;
};

export const removePolicyStep = async (id, stepId) => {
  const response = await API.delete(`/api/procurement/policies/${id}/steps/${stepId}`);
  return response.data;
};

export const deleteApprovalPolicy = async (id) => {
  const response = await API.delete(`/api/procurement/policies/${id}`);
  return response.data;
};

// ---- Quotes ----

export const submitSupplierQuote = async (requestId, data) => {
  const response = await API.post(`/api/procurement/requests/${requestId}/quotes`, data);
  return response.data;
};

export const listQuotesForRequest = async (requestId) => {
  const response = await API.get(`/api/procurement/requests/${requestId}/quotes`);
  return response.data;
};

export const listMyQuotes = async () => {
  const response = await API.get("/api/procurement/quotes/mine");
  return response.data;
};

export const acceptQuote = async (requestId, quoteId) => {
  const response = await API.post(`/api/procurement/requests/${requestId}/quotes/${quoteId}/accept`);
  return response.data;
};

// ---- Receiving ----

export const recordReceiving = async (requestId, data) => {
  const response = await API.post(`/api/procurement/requests/${requestId}/receiving`, data);
  return response.data;
};

export const listReceivingRecords = async (requestId) => {
  const response = await API.get(`/api/procurement/requests/${requestId}/receiving`);
  return response.data;
};

// ---- Invoice Matching ----

export const recordInvoiceMatch = async (requestId, data) => {
  const response = await API.post(`/api/procurement/requests/${requestId}/invoice-match`, data);
  return response.data;
};

export const listInvoiceMatches = async (requestId) => {
  const response = await API.get(`/api/procurement/requests/${requestId}/invoice-match`);
  return response.data;
};

// ---- Audit & Budget ----

export const getProcurementAuditTrail = async (requestId) => {
  const response = await API.get(`/api/procurement/requests/${requestId}/audit`);
  return response.data;
};

export const getBudgetSummary = async () => {
  const response = await API.get("/api/procurement/budget");
  return response.data;
};