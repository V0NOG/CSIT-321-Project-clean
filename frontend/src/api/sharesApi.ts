// frontend/src/api/sharesApi.ts
import axios from "axios";

const API = "/api/shares";

/** Attach bearer token if present */
function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =======================
 * Types
 * ======================= */
export type SharePermission = "viewer" | "editor";
export type ShareStatus = "pending" | "accepted" | "declined" | "revoked";

export interface ShareItem {
  _id: string;
  fileId: string;
  ownerId?: string;
  email: string;
  permission: SharePermission;
  status: ShareStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PendingInvite = {
  _id: string;
  fileId: string;
  fileName: string;
  permission: SharePermission;
  fromUserId?: string;
  email: string;
  status: "pending";
  createdAt?: string;
};

/* =======================
 * Helpers
 * ======================= */
function unwrapItems<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  return [];
}

/* =======================
 * File-scoped shares
 * ======================= */

/** List all shares for a specific file (owner view) */
export async function listFileShares(fileId: string): Promise<ShareItem[]> {
  const res = await axios.get(`${API}/file/${fileId}`, {
    headers: authHeader(),
    withCredentials: true,
  });
  return unwrapItems<ShareItem>(res.data);
}

/** Alias used in some components */
export const listSharesForFile = listFileShares;

export type CreateShareResponse = {
  message?: string;
  share?: ShareItem & {
    targetUserId?: string | null;
    targetUserPubKey?: string | null;
  };
};

/** Create (invite) a share for a file */
export async function createShare(
  fileId: string,
  payload: { email: string; permission: SharePermission; note?: string }
): Promise<CreateShareResponse> {
  const res = await axios.post(`${API}/${fileId}`, payload, {
    headers: { ...authHeader(), "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data as CreateShareResponse;
}

/** Update a share (e.g., change permission) */
export async function updateShare(
  shareId: string,
  payload: { permission: SharePermission }
) {
  const res = await axios.put(`${API}/${shareId}`, payload, {
    headers: { ...authHeader(), "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data as { message?: string; share?: ShareItem };
}

/** Revoke (delete) a share */
export async function revokeShare(shareId: string) {
  const res = await axios.delete(`${API}/${shareId}`, {
    headers: authHeader(),
    withCredentials: true,
  });
  return res.data as { message?: string };
}

/** Get a single share by id (optional, handy for debugging/deeplinks) */
export async function getShareById(shareId: string): Promise<ShareItem | null> {
  const res = await axios.get(`${API}/${shareId}`, {
    headers: authHeader(),
    withCredentials: true,
  });
  const data = res.data;
  if (!data) return null;
  // some backends return {share: {...}}
  return (data.share as ShareItem) || (data as ShareItem) || null;
}

/* =======================
 * Recipient-facing (“inbox” / “shared with me”)
 * ======================= */

/** Pending invites sent to the current user (recipient inbox) */
export async function getShareInbox(): Promise<ShareItem[]> {
  const res = await axios.get(`${API}/inbox`, {
    headers: authHeader(),
    withCredentials: true,
  });
  return unwrapItems<ShareItem>(res.data);
}

/** Files shared with the current user (accepted & optionally pending) */
export async function listSharedWithMe(includePending = false): Promise<ShareItem[]> {
  const res = await axios.get(`${API}/mine/list?includePending=${includePending ? 1 : 0}`, {
    headers: authHeader(),
    withCredentials: true,
  });
  return unwrapItems<ShareItem>(res.data);
}

/** Accept a pending share */
export async function acceptShare(shareId: string) {
  const res = await axios.post(
    `${API}/${shareId}/accept`,
    {},
    { headers: authHeader(), withCredentials: true }
  );
  return res.data as { message?: string; share?: ShareItem };
}

// NEW: pending invites for me
export async function listMyPendingInvites(): Promise<PendingInvite[]> {
  const res = await axios.get(`${API}/mine/pending`, {
    headers: authHeader(),
    withCredentials: true,
  });
  const data = res.data;
  if (Array.isArray(data)) return data as PendingInvite[];
  if (Array.isArray(data?.items)) return data.items as PendingInvite[];
  return [];
}

// NEW: respond to invite (accept / decline)
export async function respondToInvite(shareId: string, action: "accept" | "decline") {
  const res = await axios.post(
    `${API}/${shareId}/respond`,
    { action },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
  return res.data;
}

/** Decline a pending share */
export async function declineShare(shareId: string) {
  const res = await axios.post(
    `${API}/${shareId}/decline`,
    {},
    { headers: authHeader(), withCredentials: true }
  );
  return res.data as { message?: string };
}

/** Owner uploads the file key re-wrapped for the recipient (ZK sharing) */
export async function saveSharedFileKey(shareId: string, wrappedKeyB64: string) {
  const res = await axios.post(
    `${API}/${shareId}/filekey`,
    { wrappedKeyB64 },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
  return res.data as { ok: boolean };
}

/** Recipient retrieves the file key that was wrapped for them */
export async function getSharedFileKey(shareId: string): Promise<{ wrappedKeyB64: string; fileId: string }> {
  const res = await axios.get(`${API}/${shareId}/filekey`, {
    headers: authHeader(),
    withCredentials: true,
  });
  return res.data;
}

/* =======================
 * Default export (optional convenience)
 * ======================= */
export default {
  listFileShares,
  listSharesForFile,
  createShare,
  updateShare,
  revokeShare,
  getShareById,
  getShareInbox,
  listSharedWithMe,
  acceptShare,
  declineShare,
};