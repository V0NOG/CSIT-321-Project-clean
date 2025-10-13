// backend/services/dropbox.js
import { Dropbox } from "dropbox";
import fetch from "node-fetch";

export function getDropbox() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("DROPBOX_ACCESS_TOKEN missing");
  return new Dropbox({ accessToken: token, fetch });
}

/**
 * Uploads a whole file buffer to Dropbox app-folder path.
 * For large files, you can implement sessions; this keep it simple for now.
 */
export async function uploadBuffer(path, buffer, mode = "add") {
  const dbx = getDropbox();
  const res = await dbx.filesUpload({
    path,
    contents: buffer,
    mode, // "add" or {".tag":"overwrite"}
    mute: true,
    strict_conflict: false,
  });
  return res.result;
}

export async function download(path) {
  const dbx = getDropbox();
  // returns {fileBinary, result}
  const res = await dbx.filesDownload({ path });
  // res.result.fileBinary is an ArrayBuffer
  return {
    name: res.result.name,
    mime: res.result?.content_type || "application/octet-stream",
    buffer: Buffer.from(res.result.fileBinary),
  };
}

export async function deletePath(path) {
  const dbx = getDropbox();
  await dbx.filesDeleteV2({ path });
}