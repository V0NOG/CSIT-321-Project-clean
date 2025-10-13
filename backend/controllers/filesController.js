// backend/controllers/filesController.js
import mongoose from "mongoose";
import File from "../models/File.js";
import FileKey from "../models/FileKey.js";
import { uploadToDropbox, streamFromDropbox } from "../services/dropbox.js";
import path from "node:path";

function parseSort(sortStr) {
  if (!sortStr) return { createdAt: -1 };
  const [field, dir = "desc"] = String(sortStr).split(":");
  return { [field]: dir.toLowerCase() === "asc" ? 1 : -1 };
}

function buildTypeFilter(type) {
  if (!type || type === "all") return {};
  const t = String(type).toLowerCase();
  if (["image", "images"].includes(t)) return { mime: { $regex: "^image/", $options: "i" } };
  if (["video", "videos"].includes(t)) return { mime: { $regex: "^video/", $options: "i" } };
  if (["audio", "audios"].includes(t)) return { mime: { $regex: "^audio/", $options: "i" } };
  if (["document", "documents", "docs"].includes(t)) {
    const docExts = ["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","rtf","md","csv"];
    return {
      $or: [
        { mime: { $regex: "^text/", $options: "i" } },
        { name: { $regex: `\\.(${docExts.join("|")})$`, $options: "i" } },
      ],
    };
  }
  if (["app", "apps", "archive", "package"].includes(t)) {
    const appExts = ["zip", "rar", "7z", "apk", "dmg", "exe", "msi"];
    return { name: { $regex: `\\.(${appExts.join("|")})$`, $options: "i" } };
  }
  if (["other", "others"].includes(t)) {
    const docExts = ["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","rtf","md","csv"];
    const appExts = ["zip", "rar", "7z", "apk", "dmg", "exe", "msi"];
    return {
      $and: [
        { mime: { $not: { $regex: "^image/|^video/|^audio/", $options: "i" } } },
        {
          name: {
            $not: {
              $regex: `\\.(${[...docExts, ...appExts].join("|")})$`,
              $options: "i",
            },
          },
        },
      ],
    };
  }
  return {};
}

function buildDropboxPath(userId, fileId, name) {
  const safe = String(name).replace(/[^\w.\- ]+/g, "_").slice(0, 180);
  // App-folder style path. If your app is full-access, prefix as needed.
  return `/${userId}/${fileId}-${safe}`;
}

// GET /api/files
export async function listFiles(req, res) {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
  const limit = Math.min(2000, parseInt(req.query.limit ?? "20", 10) || 20);
  const q = (req.query.q || "").trim();
  const type = (req.query.type || "").toLowerCase();
  const sort = parseSort(req.query.sort);
  const filter = { owner: userId };
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const typeFilter = buildTypeFilter(type);
  if (Object.keys(typeFilter).length) Object.assign(filter, typeFilter);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    File.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    File.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
}

// POST /api/files/init
export async function initUpload(req, res) {
  const userId = req.user.id;
  const { name, size, mime } = req.body || {};
  if (!name || !Number.isFinite(size)) {
    return res.status(400).json({ error: "name and size are required" });
  }
  const doc = await File.create({
    owner: userId,
    name,
    size: Number(size),
    mime: mime || "application/octet-stream",
    status: "init",
  });
  res.status(201).json({ fileId: doc._id.toString() });
}

// POST /api/files/:id/key  (save wrapped key)
export async function setFileKey(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const { wrappedKeyB64 } = req.body || {};
  if (!wrappedKeyB64) return res.status(400).json({ error: "wrappedKeyB64 required" });

  const exists = await File.findOne({ _id: fileId, owner: userId });
  if (!exists) return res.status(404).json({ error: "File not found" });

  const doc = await FileKey.findOneAndUpdate(
    { file: fileId, owner: userId },
    { $set: { wrappedKeyB64 } },
    { upsert: true, new: true }
  );
  return res.json({ ok: true, id: doc._id.toString() });
}

// GET /api/files/:id/key (return wrapped key)
export async function getFileKey(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const keyDoc = await FileKey.findOne({ file: fileId, owner: userId }).lean();
  if (!keyDoc) return res.status(404).json({ error: "no key" });
  return res.json({ wrappedKeyB64: keyDoc.wrappedKeyB64 });
}

// POST /api/files/upload/:id  (ciphertext -> Dropbox)
export async function uploadCiphertext(req, res) {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const meta = await File.findOne({ _id: fileId, owner: userId });
    if (!meta) return res.status(404).json({ error: "File not found" });

    const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    // Store under a deterministic path (avoid collisions, allow overwrite via autorename)
    const ext = path.extname(meta.name) || ".bin";
    const dbxPath = `/csit321/${userId}/${fileId}${ext}.enc`;

    const storedPath = await uploadToDropbox(dbxPath, bytes);

    await File.updateOne(
      { _id: fileId },
      { $set: { status: "ready", storage: { dropboxPath: storedPath } } }
    );

    return res.status(200).json({ ok: true, path: storedPath });
  } catch (e) {
    console.error("[uploadCiphertext] error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
}

// GET /api/files/:id/download  (ciphertext stream from Dropbox)
export async function downloadFile(req, res) {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const doc = await File.findOne({ _id: fileId, owner: userId }).lean();
    const dropboxPath = doc?.storage?.dropboxPath;
    if (!doc || !dropboxPath) {
      return res.status(404).json({ error: "Not found" });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.name}"`
    );

    const stream = await streamFromDropbox(dropboxPath);
    stream.on("error", (err) => {
      console.error("[dropbox download stream] error:", err);
      if (!res.headersSent) res.status(500).end("Download error");
    });
    stream.pipe(res);
  } catch (e) {
    console.error("[downloadFile] error:", e);
    if (!res.headersSent) return res.status(500).json({ error: "Download failed" });
  }
}