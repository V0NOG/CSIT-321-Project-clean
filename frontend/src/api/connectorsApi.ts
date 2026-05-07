// frontend/src/api/connectorsApi.ts
import axios from "axios";

const BASE = "http://localhost:5050/api/connectors";
const SETTINGS_BASE = "http://localhost:5050/api/settings";

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

export type ConnectorConfig = {
  googleRedirectUri: string;
  dropboxRedirectUri: string;
  googleClientIdPresent: boolean;
  googleClientSecretPresent: boolean;
  dropboxAppKeyPresent: boolean;
  dropboxAppSecretPresent: boolean;
};

export async function getConnectorConfig(): Promise<ConnectorConfig> {
  const res = await axios.get(`${BASE}/config`, { headers: authHeader(), withCredentials: true });
  return res.data;
}

// ── OAuth credential management ──────────────────────────────────────────────

export type OAuthCredentialStatus = {
  present: boolean;
  source: "db" | "env" | "none";
};

export type OAuthSettingsResponse = {
  GOOGLE_CLIENT_ID: OAuthCredentialStatus;
  GOOGLE_CLIENT_SECRET: OAuthCredentialStatus;
  DROPBOX_APP_KEY: OAuthCredentialStatus;
  DROPBOX_APP_SECRET: OAuthCredentialStatus;
};

export async function getOAuthSettings(): Promise<OAuthSettingsResponse> {
  const res = await axios.get(`${SETTINGS_BASE}/oauth`, { headers: authHeader(), withCredentials: true });
  return res.data;
}

export async function saveOAuthSettings(data: {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DROPBOX_APP_KEY?: string;
  DROPBOX_APP_SECRET?: string;
}): Promise<void> {
  await axios.put(`${SETTINGS_BASE}/oauth`, data, { headers: authHeader(), withCredentials: true });
}
