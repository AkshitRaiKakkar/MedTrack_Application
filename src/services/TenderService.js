import API from "./HttpService";

// ---- Tenders ----

export const createTender = async (data) => {
  const response = await API.post("/api/tenders", data);
  return response.data;
};

export const listTenders = async () => {
  const response = await API.get("/api/tenders");
  return response.data;
};

export const getTender = async (id) => {
  const response = await API.get(`/api/tenders/${id}`);
  return response.data;
};

export const publishTender = async (id) => {
  const response = await API.post(`/api/tenders/${id}/publish`);
  return response.data;
};

export const closeTenderRound = async (id) => {
  const response = await API.post(`/api/tenders/${id}/close-round`);
  return response.data;
};

export const openTenderRound = async (id, data) => {
  const response = await API.post(`/api/tenders/${id}/open-round`, data);
  return response.data;
};

export const awardTender = async (id, data) => {
  const response = await API.post(`/api/tenders/${id}/award`, data);
  return response.data;
};

export const cancelTender = async (id) => {
  const response = await API.post(`/api/tenders/${id}/cancel`);
  return response.data;
};

// ---- Bids ----

export const submitTenderBid = async (tenderId, data) => {
  const response = await API.post(`/api/tenders/${tenderId}/bids`, data);
  return response.data;
};

export const listTenderBids = async (tenderId) => {
  const response = await API.get(`/api/tenders/${tenderId}/bids`);
  return response.data;
};

export const withdrawTenderBid = async (tenderId, bidId) => {
  const response = await API.post(`/api/tenders/${tenderId}/bids/${bidId}/withdraw`);
  return response.data;
};

// ---- Audit ----

export const getTenderAuditTrail = async (tenderId) => {
  const response = await API.get(`/api/tenders/${tenderId}/audit`);
  return response.data;
};
