// backend/controllers/filesController.js
import mongoose from "mongoose";
import File from "../models/File.js";

// ---------- helpers ----------
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

function getBucket() {
  const db = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "cipherfiles" });
}

// ---------- routes ----------

// GET /api/files?page=&limit=&q=&type=&sort=
export async function listFiles(req, res) {
  const userId = req.user.id; // <-- we consistently use "owner"
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
  if (!name || !Number.isFinite(Number(size))) {
    return res.status(400).json({ error: "name and size are required" });
  }

  const doc = await File.create({
    owner: userId,
    name,
    size: Number(size),
    mime: mime || "application/octet-stream",
    status: "pending",
    // NOTE: do NOT set dropboxPath here (avoids the unique-index null duplicate issue)
  });

  res.status(201).json({ fileId: doc._id.toString() });
}

// POST /api/files/upload/:id (Content-Type: application/octet-stream)
// body: raw ciphertext bytes
export async function uploadCiphertext(req, res) {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const meta = await File.findOne({ _id: fileId, owner: userId });
    if (!meta) return res.status(404).json({ error: "File not found" });

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(meta.name, {
      contentType: "application/octet-stream",
      metadata: {
        owner: String(userId),
        mime: meta.mime,
        logicalSize: meta.size,
      },
    });

    uploadStream.on("error", (err) => {
      console.error("[gridfs] upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    });

    uploadStream.on("finish", async () => {
      try {
        await File.updateOne(
          { _id: fileId },
          {
            $set: {
              status: "ready",
              storage: {
                ...(meta.storage || {}),
                gridFsId: uploadStream.id, // <-- store where download expects it
              },
            },
          }
        );
        return res.status(200).json({ ok: true });
      } catch (e) {
        console.error("[upload finish] update meta failed:", e);
        return res.status(500).json({ error: "Upload metadata update failed" });
      }
    });

    // pipe raw body to GridFS
    uploadStream.end(req.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected upload error" });
  }
}

// GET /api/files/:id/download
export async function downloadFile(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;

  const doc = await File.findOne({ _id: fileId, owner: userId });
  const gridId = doc?.storage?.gridFsId;
  if (!doc || !gridId) return res.status(404).json({ error: "Not found" });

  const bucket = getBucket();
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);

  const readStream = bucket.openDownloadStream(gridId);
  readStream.on("error", (err) => {
    console.error("GridFS download error:", err);
    if (!res.headersSent) res.status(500).end("Download error");
  });
  readStream.pipe(res);
}

// DELETE /api/files/:id
export async function deleteFile(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;

  const doc = await File.findOne({ _id: fileId, owner: userId });
  if (!doc) return res.status(404).json({ error: "Not found" });

  const bucket = getBucket();
  const gridId = doc.storage?.gridFsId;
  if (gridId) {
    try { await bucket.delete(gridId); } catch { /* ignore */ }
  }

  await doc.deleteOne();
  res.json({ ok: true });
}