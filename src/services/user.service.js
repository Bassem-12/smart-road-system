import axios from "axios";

// Use environment variable for API base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

export const getUsers = async () => {
  try {
    const res = await API.get("/users");
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const createUser = async (data) => {
  try {
    const res = await API.post("/users", data);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const deleteUserById = async (id) => {
  try {
    await API.delete(`/users/${id}`);
  } catch (err) {
    throw err;
  }
};
