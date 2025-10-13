// backend/services/dropbox.js
import { Readable } from "node:stream";

const APP_KEY = process.env.DROPBOX_APP_KEY || "";
const APP_SECRET = process.env.DROPBOX_APP_SECRET || "";
const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN || "";

// We’ll seed with any short-lived token if present, but always refresh on expiry.
let ACCESS_TOKEN = process.env.DROPBOX_TOKEN || "";

// Exchange refresh token -> new short-lived access token
async function refreshAccessToken() {
  if (!APP_KEY || !APP_SECRET || !REFRESH_TOKEN) {
    throw new Error(
      "[dropbox] Missing APP_KEY/APP_SECRET/REFRESH_TOKEN in env"
    );
  }
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", REFRESH_TOKEN);
  body.set("client_id", APP_KEY);
  body.set("client_secret", APP_SECRET);

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[dropbox refresh] ${res.status} ${t}`);
  }
  const json = await res.json();
  ACCESS_TOKEN = json.access_token;
  return ACCESS_TOKEN;
}

async function withValidToken(fn) {
  try {
    // Try with current token first
    return await fn(ACCESS_TOKEN);
  } catch (err) {
    const msg = String(err?.message || err);
    // If token expired, refresh once then retry
    if (msg.includes("expired_access_token")) {
      const fresh = await refreshAccessToken();
      return await fn(fresh);
    }
    throw err;
  }
}

// Upload bytes to Dropbox; returns the canonical path (lowercase)
export async function uploadToDropbox(path, bytes) {
  return withValidToken(async (token) => {
    const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path,
          mode: "add",
          autorename: true,
          mute: false,
        }),
      },
      // Ensure we send a Node-friendly buffer/Uint8Array
      body: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`[dropbox upload] ${res.status} ${t}`);
    }
    const meta = await res.json();
    // Prefer path_lower; path_display is fine too
    return meta.path_lower || meta.path_display || path;
  });
}

// Get a Node Readable stream from Dropbox download endpoint
export async function streamFromDropbox(path) {
  return withValidToken(async (token) => {
    const res = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`[dropbox download] ${res.status} ${t}`);
    }
    // Convert Web Stream -> Node Readable
    return Readable.fromWeb(res.body);
  });
}

// Delete a file in Dropbox at a given path
export async function deleteFromDropbox(path) {
  return withValidToken(async (token) => {
    const res = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`[dropbox delete] ${res.status} ${t}`);
    }
    return true;
  });
}