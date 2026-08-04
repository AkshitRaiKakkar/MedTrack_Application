import API from "./HttpService";

export const getAllTasks = async (params = {}) => {
  const { technicianId, page = 0, size = 20, status, equipmentId } = params;
  const query = new URLSearchParams();
  if (technicianId) query.set("technicianId", technicianId);
  if (page !== undefined) query.set("page", page);
  if (size !== undefined) query.set("size", size);
  if (status) query.set("status", status);
  if (equipmentId) query.set("equipmentId", equipmentId);

  const qs = query.toString();
  const url = qs ? `/api/maintenance?${qs}` : "/api/maintenance";

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch maintenance tasks:", error);
    throw error;
  }
};
export const getTaskById = async (id) => {
  try {
    const response = await API.get(`/api/maintenance/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch maintenance task:", error);
    throw error;
  }
};

export const scheduleTask = async (data) => {
  try {
    const response = await API.post("/api/maintenance", data);
    return response.data;
  } catch (error) {
    console.error("Failed to schedule maintenance task:", error);
    throw error;
  }
};


export const updateTask = async (id, data) => {
  try {
    const response = await API.put(`/api/maintenance/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update maintenance task:", error);
    throw error;
  }
};

// Export all tasks to iCal .ics file format
export const exportTasksToICal = async () => {
  const response = await API.get("/api/maintenance/export/calendar.ics", {
    responseType: "text",
  });
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await API.delete(`/api/maintenance/${id}`);
  return response.data;
};

// ============================================================
// Preventive-maintenance automation
// ============================================================

const automation = "/api/maintenance/automation";

export const listRules = async () => {
  const response = await API.get(`${automation}/rules`);
  return response.data;
};

export const getRule = async (id) => {
  const response = await API.get(`${automation}/rules/${id}`);
  return response.data;
};

export const createRule = async (data) => {
  const response = await API.post(`${automation}/rules`, data);
  return response.data;
};

export const updateRule = async (id, data) => {
  const response = await API.put(`${automation}/rules/${id}`, data);
  return response.data;
};

export const deleteRule = async (id) => {
  const response = await API.delete(`${automation}/rules/${id}`);
  return response.data;
};

export const previewRule = async (id, windowStart, windowEnd) => {
  const params = new URLSearchParams();
  if (windowStart) params.set("windowStart", windowStart);
  if (windowEnd) params.set("windowEnd", windowEnd);
  const qs = params.toString();
  const url = qs ? `${automation}/rules/${id}/preview?${qs}` : `${automation}/rules/${id}/preview`;
  const response = await API.get(url);
  return response.data;
};

export const generateTasks = async (id, windowStart, windowEnd) => {
  const params = new URLSearchParams();
  if (windowStart) params.set("windowStart", windowStart);
  if (windowEnd) params.set("windowEnd", windowEnd);
  const qs = params.toString();
  const url = qs ? `${automation}/rules/${id}/generate?${qs}` : `${automation}/rules/${id}/generate`;
  const response = await API.post(url);
  return response.data;
};

export const getSlaSummary = async () => {
  const response = await API.get(`${automation}/sla`);
  return response.data;
};

export const refreshSla = async () => {
  const response = await API.post(`${automation}/sla/refresh`);
  return response.data;
};

export const getTechnicianWorkload = async () => {
  const response = await API.get(`${automation}/workload`);
  return response.data;
};
