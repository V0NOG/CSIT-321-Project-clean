// frontend/src/api/connectorsApi.ts
import axios from "axios";

const BASE = "http://localhost:5050/api/connectors";

function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type StorageConnector = {
  _id: string;
  provider: "dropbox" | "google_drive";
  name: string;
  providerEmail?: string;
  providerName?: string;
  isActive: boolean;
  createdAt: string;
};

export async function listConnectors(): Promise<StorageConnector[]> {
  const res = await axios.get(BASE, { headers: authHeader(), withCredentials: true });
  return res.data.items || [];
}

export async function deleteConnector(id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`, { headers: authHeader(), withCredentials: true });
}

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await axios.get(`${BASE}/google/auth`, { headers: authHeader(), withCredentials: true });
  return res.data.authUrl;
}

export async function getDropboxAuthUrl(): Promise<string> {
  const res = await axios.get(`${BASE}/dropbox/auth`, { headers: authHeader(), withCredentials: true });
  return res.data.authUrl;
}
