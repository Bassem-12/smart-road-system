import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({

  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  let token = sessionStorage.getItem("token");

  if (!token) {
    token = localStorage.getItem("token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");

      if (!window.location.pathname.includes("/signin")) {
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  }
);

export default api;


