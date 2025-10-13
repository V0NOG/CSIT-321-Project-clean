// backend/controllers/filesController.js
import mongoose from "mongoose";
import File from "../models/File.js";
import path from "node:path";

function parseSort(sortStr) {
  // "createdAt:desc" -> { createdAt: -1 }
  if (!sortStr) return { createdAt: -1 };
  const [field, dir = "desc"] = String(sortStr).split(":");
  return { [field]: dir.toLowerCase() === "asc" ? 1 : -1 };
}

// Server-side categorize similar to frontend utils
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
    // "Other" = not image/video/audio/document/apps (approx)
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

function getBucket() {
  const db = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "cipherfiles" });
}

// GET /api/files?page=&limit=&q=&type=&sort=
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
// body: { name, size, mime }
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
  });

  res.status(201).json({ fileId: doc._id.toString() });
}

// POST /api/files/upload/:id (Content-Type: application/octet-stream)
// body: raw ciphertext stream -> GridFS
export async function uploadCiphertext(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const doc = await File.findOne({ _id: fileId, owner: userId });
  if (!doc) return res.status(404).json({ error: "File not found" });

  if (doc?.storage?.gridFsId) {
    return res.status(409).json({ error: "Already uploaded" });
  }

  const bucket = getBucket();
  const filename = `${fileId}-${path.basename(doc.name)}`;

  const uploadStream = bucket.openUploadStream(filename, {
    metadata: { owner: userId, fileId, mime: doc.mime },
    contentType: "application/octet-stream",
  });

  req.pipe(uploadStream)
    .on("error", (err) => {
      console.error("GridFS upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    })
    .on("finish", async (file) => {
      // file contains { _id, length, filename, ... }
      doc.storage = {
        gridFsId: file._id,
        length: file.length,
        filename: file.filename,
      };
      await doc.save();
      res.json({ ok: true, bytes: file.length });
    });
}

// GET /api/files/:id/download -> streams ciphertext back
export async function downloadFile(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const doc = await File.findOne({ _id: fileId, owner: userId });
  if (!doc || !doc?.storage?.gridFsId) return res.status(404).json({ error: "Not found" });

  const bucket = getBucket();
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);

  const readStream = bucket.openDownloadStream(doc.storage.gridFsId);
  readStream.on("error", (err) => {
    console.error("GridFS download error:", err);
    if (!res.headersSent) res.status(500).end("Download error");
  });
  readStream.pipe(res);
}

// Optional: DELETE /api/files/:id
export async function deleteFile(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const doc = await File.findOne({ _id: fileId, owner: userId });
  if (!doc) return res.status(404).json({ error: "Not found" });

  const bucket = getBucket();
  if (doc.storage?.gridFsId) {
    try { await bucket.delete(doc.storage.gridFsId); } catch (e) { /* ignore */ }
  }
  await doc.deleteOne();
  res.json({ ok: true });
}