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
