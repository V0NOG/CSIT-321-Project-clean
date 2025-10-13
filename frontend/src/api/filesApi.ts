// src/api/filesApi.ts
import axios from "axios";

const BASE = "http://localhost:5050/api";

// ---- axios instance with auth on every request ----
const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    "";
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- types ----
export type ListParams = {
  page?: number;        // 1-based
  limit?: number;       // page size
  q?: string;           // search term
  type?: string;        // optional category/type filter
  sort?: string;        // e.g., "createdAt:desc" or "name:asc"
};

export type FileRow = {
  _id: string;
  name: string;
  size: number;
  mime: string;
  createdAt: string;
  storage?: { gridFsId?: string };
};

export type ListResponse = {
  items: FileRow[];
  total: number;
  page: number;
  limit: number;
};

// ---- API calls ----

// List
export async function listMyFiles(
  { page = 1, limit = 10, sort = "createdAt:desc", q = "", type = "" }: ListParams,
  opts?: { signal?: AbortSignal }
): Promise<{ items: any[]; total: number; page: number; limit: number }> {
  const params: any = { page, limit, sort, q };
  if (type) params.type = type;
  const res = await api.get("/files", { params, signal: opts?.signal as any });
  return {
    items: res.data.items || [],
    total: res.data.total || 0,
    page: res.data.page || page,
    limit: res.data.limit || limit,
  };
}

// Init upload (metadata)
export async function initUpload(meta: { name: string; size: number; mime: string }) {
  const res = await api.post("/files/init", meta);
  return res.data as { fileId: string };
}

// Upload ciphertext (raw bytes to /upload/:id)
export async function uploadCiphertext(fileId: string, data: ArrayBuffer | Uint8Array | Blob) {
  let body: ArrayBuffer;
  if (data instanceof ArrayBuffer) {
    body = data;
  } else if (data instanceof Blob) {
    body = await data.arrayBuffer();
  } else {
    body = data.buffer;
  }

  const res = await api.post(`/files/upload/${fileId}`, body, {
    headers: { "Content-Type": "application/octet-stream" },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
}

// Download (streams back ciphertext)
export async function downloadFile(fileId: string) {
  const res = await api.get(`/files/${fileId}/download`, {
    responseType: "blob",
  });
  return res.data as Blob;
}