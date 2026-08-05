import API from "./HttpService";

// Fetch equipment with pagination
export const getAllEquipment = async (page = 0, size = 20) => {
  const response = await API.get(`/api/equipment?page=${page}&size=${size}`);
  return response.data;
};

// Fetch a single equipment item by ID
export const getEquipmentById = async (id) => {
  const response = await API.get(`/api/equipment/${id}`);
  return response.data;
};

// Add new equipment
export const addEquipment = async (data) => {
  const response = await API.post("/api/equipment", data);
  return response.data;
};

// Delete equipment by ID
export const deleteEquipment = async (id) => {
  const response = await API.delete(`/api/equipment/${id}`);
  return response.data;
};

// Bulk upload equipment CSV file
export const importEquipmentCsv = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post("/api/equipment/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Dry-run preview: validate a bulk import without committing anything
export const previewEquipmentImport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post("/api/equipment/import/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Recent bulk import batches for the authenticated hospital (audit trail)
export const getEquipmentImportHistory = async () => {
  const response = await API.get("/api/equipment/imports/audit");
  return response.data;
};

// Fetch QR Code for a specific equipment by ID
export const getEquipmentQrCode = async (id) => {
  const response = await API.get(`/api/equipment/${id}/qr-code`);
  return response.data;
};

// Update equipment details by ID
export const updateEquipment = async (id, data) => {
  const response = await API.put(`/api/equipment/${id}`, data);
  return response.data;
};

export const getEquipmentLifecycle = async (id) => {
  const response = await API.get(`/api/equipment/${id}/lifecycle`);
  return response.data;
};

// Read-only lifecycle timeline (issue #704): purchase, assignments, transfers, maintenance,
// retirements and system alerts aggregated from existing records into chronological order.
export const getEquipmentTimeline = async (id) => {
  const response = await API.get(`/api/equipment/${id}/timeline`);
  return response.data;
};

export const createEquipmentLifecycleAction = async (id, data) => {
  const response = await API.post(`/api/equipment/${id}/lifecycle`, data);
  return response.data;
};

export const approveEquipmentLifecycleAction = async (actionId) => {
  const response = await API.post(`/api/equipment/lifecycle/${actionId}/approve`);
  return response.data;
};

export const rejectEquipmentLifecycleAction = async (actionId, reason = "") => {
  const response = await API.post(`/api/equipment/lifecycle/${actionId}/reject`, { reason });
  return response.data;
};

export const completeEquipmentLifecycleAction = async (actionId) => {
  const response = await API.post(`/api/equipment/lifecycle/${actionId}/complete`);
  return response.data;
};

// ---------------------------------------------------------------------------
// Retirement / disposal workflow (issue #744)
// ---------------------------------------------------------------------------

// Retired and disposed assets, paginated - the dedicated retired view.
export const getRetiredEquipment = async (page = 0, size = 20) => {
  const response = await API.get(`/api/equipment/retired?page=${page}&size=${size}`);
  return response.data;
};

// Open a decommissioning request for one asset.
export const requestEquipmentDisposal = async (id, data) => {
  const response = await API.post(`/api/equipment/${id}/disposal`, data);
  return response.data;
};

// Disposal records for a single asset.
export const getEquipmentDisposals = async (id) => {
  const response = await API.get(`/api/equipment/${id}/disposals`);
  return response.data;
};

// Disposals awaiting manager approval.
export const getPendingDisposals = async () => {
  const response = await API.get("/api/equipment/disposals/pending");
  return response.data;
};

// Full disposal history for the hospital.
export const getDisposalHistory = async () => {
  const response = await API.get("/api/equipment/disposals/history");
  return response.data;
};

export const approveDisposal = async (disposalId) => {
  const response = await API.post(`/api/equipment/disposals/${disposalId}/approve`);
  return response.data;
};

export const rejectDisposal = async (disposalId, reason = "") => {
  const response = await API.post(`/api/equipment/disposals/${disposalId}/reject`, { reason });
  return response.data;
};

export const cancelDisposal = async (disposalId) => {
  const response = await API.post(`/api/equipment/disposals/${disposalId}/cancel`);
  return response.data;
};

// Data-sanitisation confirmation for devices that stored patient/operational data.
export const recordDataSanitization = async (disposalId, details = "") => {
  const response = await API.post(`/api/equipment/disposals/${disposalId}/data-sanitization`, { details });
  return response.data;
};

export const completeDisposal = async (disposalId) => {
  const response = await API.post(`/api/equipment/disposals/${disposalId}/complete`);
  return response.data;
};

// Certificate of disposal (PDF blob).
export const downloadDisposalCertificate = async (disposalId) => {
  const response = await API.get(`/api/equipment/disposals/${disposalId}/certificate`, {
    responseType: "blob",
  });
  return response.data;
};
