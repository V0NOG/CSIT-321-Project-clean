// backend/services/googledrive.js
import { OAuth2Client } from "google-auth-library";
import { Readable } from "node:stream";
import fetch from "node-fetch";
import { loadCredential } from "./credentialLoader.js";

export const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5050"}/api/connectors/google/callback`;

async function getCreds() {
  const [clientId, clientSecret] = await Promise.all([
    loadCredential("GOOGLE_CLIENT_ID"),
    loadCredential("GOOGLE_CLIENT_SECRET"),
  ]);
  return { clientId, clientSecret };
}

function makeClient(clientId, clientSecret) {
  return new OAuth2Client(clientId, clientSecret, REDIRECT_URI);
}

export async function getAuthUrl(stateToken) {
  const { clientId, clientSecret } = await getCreds();
  const client = makeClient(clientId, clientSecret);
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: stateToken,
    prompt: "consent",
  });
}

export async function exchangeCode(code) {
  const { clientId, clientSecret } = await getCreds();
  const client = makeClient(clientId, clientSecret);
  const { tokens } = await client.getToken(code);
  return tokens;
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
  const { clientId, clientSecret } = await getCreds();
  const client = makeClient(clientId, clientSecret);
  client.setCredentials(tokens);
  const { credentials } = await client.refreshAccessToken();
  return { ...tokens, ...credentials };
}

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

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fresh.access_token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      body,
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[gdrive upload] ${res.status} ${t}`);
  }
  const json = await res.json();
  return { fileId: json.id, updatedTokens: fresh };
}

export async function streamFromDrive(tokens, driveFileId) {
  const fresh = await refreshIfNeeded(tokens);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    { headers: { Authorization: `Bearer ${fresh.access_token}` } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[gdrive download] ${res.status} ${t}`);
  }
  return { stream: Readable.fromWeb(res.body), updatedTokens: fresh };
}

export async function deleteFromDrive(tokens, driveFileId) {
  const fresh = await refreshIfNeeded(tokens);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${fresh.access_token}` },
  });
  if (!res.ok && res.status !== 404) {
    const t = await res.text();
    throw new Error(`[gdrive delete] ${res.status} ${t}`);
  }
  return fresh;
}
