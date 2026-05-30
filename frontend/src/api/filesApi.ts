// src/api/filesApi.ts
import axios from "axios";
import { unwrapFileKey, wrapFileKey, genFileKey } from "../crypto/keys";
import { decryptAesGcmToBlob } from "../crypto/decrypt";
import { encryptFileBlob } from "../crypto/encrypt";

const BASE = "/api";

const authHeader = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("userToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  sort?: string;
  folder?: string; // ObjectId or "null" for root
};

export type FileRow = {
  _id: string;
  name: string;
  size: number;
  mime: string;
  status?: string;
  createdAt: string;
  storage?: { dropboxPath?: string };
};

export type ListResponse = {
  items: FileRow[];
  total: number;
  page: number;
  limit: number;
};

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// ---------- LIST ----------
export async function listMyFiles(
  { page = 1, limit = 10, sort = "createdAt:desc", q = "", type = "", folder }: ListParams,
  opts?: { signal?: AbortSignal }
): Promise<{ items: any[]; total: number }> {
  const params: any = { page, limit, sort, q };
  if (type) params.type = type;
  if (folder !== undefined) params.folder = folder;
  const res = await api.get("/files", { params, signal: opts?.signal, headers: { ...authHeader() } });
  return { items: res.data.items || [], total: res.data.total || 0 };
}

// ---------- UPLOAD FLOW HELPERS ----------

// 1) Init metadata row
export async function initUpload(meta: { name: string; size: number; mime: string }) {
  const res = await api.post("/files/init", meta, { headers: { ...authHeader() } });
  return res.data as { fileId: string };
}

// 2) Save wrapped file key
export async function setFileKey(fileId: string, wrappedKeyB64: string) {
  const res = await api.post(`/files/${fileId}/key`, { wrappedKeyB64 }, { headers: { ...authHeader() } });
  if (!res.data?.ok) throw new Error("Failed to save key");
  return res.data;
}

// 3) Upload ciphertext (Blob of iv||cipher+tag)
export async function uploadCiphertext(fileId: string, blob: Blob, connectorId?: string) {
  const buf = await blob.arrayBuffer();
  const url = connectorId
    ? `${BASE}/files/upload/${fileId}?connector=${encodeURIComponent(connectorId)}`
    : `${BASE}/files/upload/${fileId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/octet-stream" },
    body: buf,
  });
  if (!res.ok) throw new Error("Cipher upload failed");
  return res.json();
}

// High-level helper: encrypt + set key + upload (optionally to a specific connector)
export async function encryptWrapAndUpload(file: File, connectorId?: string): Promise<{ fileId: string }> {
  const { fileId } = await initUpload({ name: file.name, size: file.size, mime: file.type || "application/octet-stream" });

  const fileKey = genFileKey();
  const { ciphertext } = await encryptFileBlob(file, fileKey);

  const wrappedKeyB64 = await wrapFileKey(fileKey);
  await setFileKey(fileId, wrappedKeyB64);

  await uploadCiphertext(fileId, ciphertext, connectorId);

  return { fileId };
}

// ---------- DOWNLOAD + DECRYPT ----------

// server returns raw ciphertext blob (iv||cipher)
export async function downloadFile(fileId: string): Promise<Blob> {
  const res = await fetch(`${BASE}/files/${fileId}/download`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error("Download failed");
  return await res.blob();
}

export async function getFileKey(fileId: string): Promise<{ wrappedKeyB64: string }> {
  const res = await api.get(`/files/${fileId}/key`, { headers: { ...authHeader() } });
  return res.data;
}

export async function listSharedFiles() {
  const res = await axios.get("/api/files/shared", {
    headers: authHeader(),
    withCredentials: true,
  });
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

/**
 * Full download: fetch wrapped key, unwrap with KEK, download ciphertext, decrypt to Blob.
 */
export async function downloadDecryptedBlob(row: { _id: string; name: string; mime: string }) {
  const [{ wrappedKeyB64 }, cipherBlob] = await Promise.all([
    getFileKey(row._id),
    downloadFile(row._id),
  ]);

  const fileKey = await unwrapFileKey(wrappedKeyB64); // 32 bytes expected
  const plainBlob = await decryptAesGcmToBlob(cipherBlob, fileKey, row.mime || "application/octet-stream");
  return plainBlob;
}

/**
 * Download a shared file using the ZK path:
 * 1. Fetch the key blob wrapped with our RSA public key from the share record
 * 2. Decrypt with our RSA private key (which was wrapped with our KEK)
 * 3. Download ciphertext from backend (share recipient is authorized)
 * 4. Decrypt file and return blob
 */
export async function downloadSharedDecryptedBlob(
  shareId: string,
  fileMeta: { _id: string; name: string; mime: string }
): Promise<Blob> {
  const { getSharedFileKey } = await import("./sharesApi");
  const { getMyKeys } = await import("./keysApi");
  const { unwrapSharedFileKey } = await import("../crypto/asymmetric");

  const [{ wrappedKeyB64 }, { encPrivKey }] = await Promise.all([
    getSharedFileKey(shareId),
    getMyKeys(),
  ]);

  if (!encPrivKey) throw new Error("Your encryption keys are not set up. Please log in again.");

  const fileKey = await unwrapSharedFileKey(wrappedKeyB64, encPrivKey);
  const cipherBlob = await downloadFile(fileMeta._id);
  return decryptAesGcmToBlob(cipherBlob, fileKey, fileMeta.mime || "application/octet-stream");
}

// RENAME
export async function renameFile(id: string, name: string) {
  const res = await api.put(`/files/${id}`, { name }, { headers: { ...authHeader() } });
  return res.data as { ok: boolean; file: FileRow };
}

// DELETE
export async function deleteFile(id: string) {
  const res = await api.delete(`/files/${id}`, { headers: { ...authHeader() } });
  return res.data as { ok: boolean };
}