import axios from "axios";

// Use environment variable for API base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// ===== Alerts Log =====
export const getIncidents = async () => {
  const res = await API.get("/incidents");
  return res.data;
};

// ===== Live Map =====
export const getMapIncidents = async () => {
  const res = await API.get("/incidents/map");
  return res.data;
};

export const updateIncidentStatus = async (id, status) => {
  await API.patch(`/incidents/${id}/status`, { status });
};
