// frontend/src/api/userApi.ts
import axios from "axios";
const API_URL = "http://localhost:5050/api/user";

function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getUserProfile = async () => {
  const res = await axios.get(`${API_URL}/me`, { headers: authHeader() });
  return res.data;
};

export const updateUserProfile = async (userData: any) => {
  const res = await axios.put(`${API_URL}/me`, userData, { headers: authHeader() });
  return res.data;
};