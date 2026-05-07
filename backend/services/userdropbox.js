// backend/services/userdropbox.js
// Dropbox operations using a specific user's OAuth tokens (not the app-level tokens).
import { Readable } from "node:stream";

const APP_KEY = process.env.DROPBOX_APP_KEY || "";
const APP_SECRET = process.env.DROPBOX_APP_SECRET || "";
const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5050"}/api/connectors/dropbox/callback`;

export function getAuthUrl(stateToken) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: APP_KEY,
    redirect_uri: REDIRECT_URI,
    state: stateToken,
    token_access_type: "offline",
  });
  return `https://www.dropbox.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: APP_KEY,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[dropbox exchange] ${res.status} ${t}`);
  }
  return res.json(); // { access_token, refresh_token, token_type, ... }
}

export async function getUserInfo(accessToken) {
  const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: "null",
  });
  if (!res.ok) return null;
  return res.json();
}

async function refreshToken(tokens) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
    client_id: APP_KEY,
    client_secret: APP_SECRET,
  });
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("[dropbox user refresh] failed");
  const json = await res.json();
  return { ...tokens, access_token: json.access_token };
}

async function withValidToken(tokens, fn) {
  try {
    return await fn(tokens.access_token, tokens);
  } catch (err) {
    if (String(err?.message || "").includes("expired_access_token")) {
      const fresh = await refreshToken(tokens);
      const result = await fn(fresh.access_token, fresh);
      return result;
    }
    throw err;
  }
}

export async function uploadToUserDropbox(tokens, path, bytes) {
  return withValidToken(tokens, async (accessToken, currentTokens) => {
    const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({ path, mode: "add", autorename: true, mute: false }),
      },
      body: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`[dropbox user upload] ${res.status} ${t}`);
    }
    const meta = await res.json();
    return { path: meta.path_lower || meta.path_display || path, updatedTokens: currentTokens };
  });
}

export async function streamFromUserDropbox(tokens, path) {
  return withValidToken(tokens, async (accessToken, currentTokens) => {
    const res = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`[dropbox user download] ${res.status} ${t}`);
    }
    return { stream: Readable.fromWeb(res.body), updatedTokens: currentTokens };
  });
}

export async function deleteFromUserDropbox(tokens, path) {
  return withValidToken(tokens, async (accessToken, currentTokens) => {
    const res = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!res.ok && res.status !== 409) {
      const t = await res.text();
      throw new Error(`[dropbox user delete] ${res.status} ${t}`);
    }
    return currentTokens;
  });
}
