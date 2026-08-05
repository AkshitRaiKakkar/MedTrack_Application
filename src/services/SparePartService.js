import API from "./HttpService";

/**
 * Service for managing spare parts and consumables catalog.
 */

// Fetch all spare parts
export const getAllSpareParts = async () => {
  const response = await API.get("/api/spare-parts");
  return response.data;
};

// Fetch low stock alerts
export const getLowStockAlerts = async () => {
  const response = await API.get("/api/spare-parts/low-stock");
  return response.data;
};

// Create a new spare part
export const createSparePart = async (sparePart) => {
  const response = await API.post("/api/spare-parts", sparePart);
  return response.data;
};

// Update an existing spare part
export const updateSparePart = async (id, sparePart) => {
  const response = await API.put(`/api/spare-parts/${id}`, sparePart);
  return response.data;
};

// Delete a spare part
export const deleteSparePart = async (id) => {
  const response = await API.delete(`/api/spare-parts/${id}`);
  return response.data;
};
