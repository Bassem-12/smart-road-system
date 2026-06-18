import api from "./api";

export async function getDashboardData() {
  const [statsRes, incidentsRes, systemRes, summaryRes] = await Promise.all([
    api.get("/dashboard/stats"),
    api.get("/dashboard/incidents"),
    api.get("/dashboard/system-status"),
    api.get("/dashboard/summary"),
  ]);

  return {
    stats: statsRes.data,
    recentIncidents: incidentsRes.data,
    systemStatus: systemRes.data,
    todaySummary: summaryRes.data,
  };
}

export async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");
  return response.data;
}

export async function getRecentIncidents() {
  const response = await api.get("/dashboard/incidents");
  return response.data;
}

export async function getSystemStatus() {
  const response = await api.get("/dashboard/system-status");
  return response.data;
}

export async function getTodaySummary() {
  const response = await api.get("/dashboard/summary");
  return response.data;
}

export default {
  getDashboardData,
  getDashboardStats,
  getRecentIncidents,
  getSystemStatus,
  getTodaySummary,
};

