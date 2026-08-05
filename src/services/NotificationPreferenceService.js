import API from "./HttpService";

const BASE = "/api/notifications/preferences";

export const getNotificationPreferences = async () => {
  try {
    const response = await API.get(BASE);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    throw error;
  }
};

export const setNotificationPreference = async (category, muted) => {
  try {
    const response = await API.put(BASE, { category, muted });
    return response.data;
  } catch (error) {
    console.error("Failed to update notification preference:", error);
    throw error;
  }
};
