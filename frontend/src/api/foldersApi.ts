// frontend/src/api/foldersApi.ts
import axios from "axios";

const BASE = "/api/folders";

function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type Folder = {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
};

export async function listFolders(q?: string): Promise<Folder[]> {
  const params = q ? { q } : undefined;
  const res = await axios.get(BASE, { headers: authHeader(), withCredentials: true, params });
  return res.data.items || [];
}

export async function createFolder(name: string, color?: string): Promise<Folder> {
  const res = await axios.post(
    BASE,
    { name, color: color || "#6B7280" },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
  return res.data.folder;
}

export async function renameFolder(id: string, name: string, color?: string): Promise<Folder> {
  const res = await axios.put(
    `${BASE}/${id}`,
    { name, color },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
  return res.data.folder;
}

export async function deleteFolder(id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`, { headers: authHeader(), withCredentials: true });
}

export async function moveFileToFolder(fileId: string, folderId: string | null): Promise<void> {
  await axios.put(
    `${BASE}/files/${fileId}/move`,
    { folderId },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
}
