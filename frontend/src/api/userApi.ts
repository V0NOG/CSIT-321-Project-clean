import axios from "axios";

const API_URL = "http://localhost:5050/api/user";

const token = localStorage.getItem("userToken");

export const getUserProfile = async () => {
  const res = await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateUserProfile = async (userData: any) => {
  const res = await axios.put(`${API_URL}/profile`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};