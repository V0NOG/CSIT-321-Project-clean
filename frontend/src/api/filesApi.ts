import axios from "axios";

const BASE = "http://localhost:5050/api";

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
};

export async function listMyFiles(
  { page = 1, limit = 10, sort = "createdAt:desc", q = "", type = "" }: ListParams,
  opts?: { signal?: AbortSignal }
): Promise<{ items: any[]; total: number }> {
  const api = axios.create({ baseURL: BASE, withCredentials: true });
  const params: any = { page, limit, sort, q };
  if (type) params.type = type;
  const res = await api.get("/files", { params, signal: opts?.signal, headers: { ...authHeader() } });
  return { items: res.data.items || [], total: res.data.total || 0 };
}

export async function initUpload(meta: { name: string; size: number; mime: string }) {
  const res = await fetch(`${BASE}/files/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(meta),
  });
  if (!res.ok) throw new Error("Init failed");
  return res.json(); // { fileId }
}

// store wrapped key only
export async function setFileKey(fileId: string, wrappedKeyB64: string) {
  const res = await fetch(`${BASE}/files/${fileId}/key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ wrappedKeyB64 }),
  });
  if (!res.ok) throw new Error(`Failed to save key (${res.status})`);
  return res.json();
}

export async function getFileKey(fileId: string) {
  const res = await fetch(`${BASE}/files/${fileId}/key`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Key not found");
  return res.json(); // { wrappedKeyB64 }
}

export async function uploadCiphertext(fileId: string, blob: Blob | ArrayBuffer) {
  const body = blob instanceof Blob ? await blob.arrayBuffer() : blob;
  const res = await fetch(`${BASE}/files/upload/${fileId}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", ...authHeader() },
    body,
  });
  if (!res.ok) throw new Error("Cipher upload failed");
  return res.json();
}

export async function downloadFile(fileId: string) {
  const res = await fetch(`${BASE}/files/${fileId}/download`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Download failed");
  return await res.arrayBuffer();
}

// decrypt-on-download helper (pass a decryptFn)
export async function downloadDecryptedBlob(
  fileId: string,
  name: string,
  unwrapFn: (wrappedKeyB64: string) => Promise<{ keyB64: string; ivB64: string }>,
  decryptFn: (bytes: ArrayBuffer, keyB64: string, ivB64: string) => Promise<Blob>
) {
  const [{ wrappedKeyB64 }, cipher] = await Promise.all([
    getFileKey(fileId),
    downloadFile(fileId),
  ]);
  const { keyB64, ivB64 } = await unwrapFn(wrappedKeyB64);
  const plainBlob = await decryptFn(cipher, keyB64, ivB64);

  const url = URL.createObjectURL(plainBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}