import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: true,
});

export type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  sort?: string;
};

export type FileRow = {
  _id: string;
  name: string;
  size: number;
  mime: string;
  createdAt: string;
};

export type ListResponse = {
  items: FileRow[];
  total: number;
  page: number;
  limit: number;
};

export async function listMyFiles(
  { page = 1, limit = 10, sort = "createdAt:desc", q = "", type = "" },
  opts?: { signal?: AbortSignal }
): Promise<{ items: any[]; total: number }> {
  const params: any = { page, limit, sort, q };
  if (type) params.type = type;
  const res = await api.get("/files", { params, signal: opts?.signal });
  return { items: res.data.items || [], total: res.data.total || 0 };
}

export async function initUpload(meta: { name: string; size: number; mime: string }) {
  // keep this aligned with your backend; change to "/files" if that's the route you implemented
  const res = await api.post("/files/init", meta);
  return res.data; // { fileId }
}

export async function uploadCiphertext(fileId: string, blob: Blob) {
  const form = new FormData();
  form.append("file", blob);
  const res = await api.post(`/files/${fileId}/data`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Try /data then fallback to /download (handles both backend shapes)
export async function downloadFile(fileId: string) {
  try {
    const res = await api.get(`/files/${fileId}/data`, { responseType: "blob" });
    return res.data as Blob;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      const res2 = await api.get(`/files/${fileId}/download`, { responseType: "blob" });
      return res2.data as Blob;
    }
    throw e;
  }
}