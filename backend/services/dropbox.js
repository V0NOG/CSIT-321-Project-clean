// backend/services/dropbox.js
import { Readable } from "node:stream";
import fetch from "node-fetch";

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;

function assertToken() {
  if (!DROPBOX_TOKEN) throw new Error("DROPBOX_TOKEN not set");
}

export function dropboxPathFor(userId, fileId, name = "blob.bin") {
  // keep it simple & unique per file
  const safe = name.replace(/[\/\\]+/g, "_");
  return `/vault/${userId}/${fileId}/${safe}`;
}

// Upload a Node Buffer or Uint8Array to Dropbox (content-upload)
export async function uploadToDropbox(path, bytes) {
  assertToken();
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DROPBOX_TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite", mute: true }),
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Dropbox upload failed: ${res.status} ${t}`);
  }
  return res.json();
}

// Download as a Node stream (content-download)
export async function streamFromDropbox(path) {
  assertToken();
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DROPBOX_TOKEN}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Dropbox download failed: ${res.status} ${t}`);
  }
  // node-fetch gives a Node.js Readable stream in res.body
  if (!(res.body instanceof Readable)) {
    // convert WHATWG stream to Node Readable if necessary
    const reader = res.body.getReader?.();
    if (!reader) throw new Error("Unsupported stream type from Dropbox");
    return Readable.from((async function* () {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) yield value;
      }
    })());
  }
  return res.body;
}