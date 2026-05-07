// backend/services/googledrive.js
// Google Drive API v3 operations using google-auth-library + node-fetch.
import { OAuth2Client } from "google-auth-library";
import { Readable } from "node:stream";
import fetch from "node-fetch";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5050"}/api/connectors/google/callback`;

export function createOAuth2Client() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(stateToken) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/userinfo.email"],
    state: stateToken,
    prompt: "consent",
  });
}

export async function exchangeCode(code) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date, ... }
}

export async function getUserInfo(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function refreshIfNeeded(tokens) {
  if (!tokens.expiry_date || Date.now() < tokens.expiry_date - 60_000) return tokens;
  const client = createOAuth2Client();
  client.setCredentials(tokens);
  const { credentials } = await client.refreshAccessToken();
  return { ...tokens, ...credentials };
}

// Upload bytes to Google Drive; returns { fileId, updatedTokens }
export async function uploadToDrive(tokens, filename, bytes) {
  const fresh = await refreshIfNeeded(tokens);
  const boundary = "-------boundary_csit321";
  const metadata = JSON.stringify({ name: filename, mimeType: "application/octet-stream" });

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(metadata),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes),
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fresh.access_token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": body.length,
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[gdrive upload] ${res.status} ${t}`);
  }
  const json = await res.json();
  return { fileId: json.id, updatedTokens: fresh };
}

// Stream a file from Google Drive; returns Node Readable
export async function streamFromDrive(tokens, driveFileId) {
  const fresh = await refreshIfNeeded(tokens);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${fresh.access_token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[gdrive download] ${res.status} ${t}`);
  }
  return { stream: Readable.fromWeb(res.body), updatedTokens: fresh };
}

// Delete a file from Google Drive
export async function deleteFromDrive(tokens, driveFileId) {
  const fresh = await refreshIfNeeded(tokens);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${fresh.access_token}` },
  });
  // 204 = success, 404 = already gone — both are fine
  if (!res.ok && res.status !== 404) {
    const t = await res.text();
    throw new Error(`[gdrive delete] ${res.status} ${t}`);
  }
  return fresh;
}
