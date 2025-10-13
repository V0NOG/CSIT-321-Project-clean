import File from "../models/File.js";
import FileKey from "../models/FileKey.js";
import { uploadToDropbox, streamFromDropbox, dropboxPathFor } from "../services/dropbox.js";

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

// ---------- LIST ----------
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

// ---------- INIT ----------
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

// ---------- KEY: SAVE ----------
export async function setFileKey(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const { keyB64, ivB64 } = req.body || {};
  if (!keyB64 || !ivB64) return res.status(400).json({ error: "keyB64 and ivB64 are required" });

  const file = await File.findOne({ _id: fileId, owner: userId }).lean();
  if (!file) return res.status(404).json({ error: "File not found" });

  await FileKey.findOneAndUpdate(
    { owner: userId, file: file._id },
    { $set: { keyB64, ivB64 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ ok: true });
}

// ---------- KEY: LOAD ----------
export async function getFileKey(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;

  const doc = await FileKey.findOne({ owner: userId, file: fileId }).lean();
  if (!doc) return res.status(404).json({ error: "Key not found" });

  res.json({ keyB64: doc.keyB64, ivB64: doc.ivB64 });
}

// ---------- UPLOAD CIPHERTEXT → DROPBOX ----------
export async function uploadCiphertext(req, res) {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const meta = await File.findOne({ _id: fileId, owner: userId });
    if (!meta) return res.status(404).json({ error: "File not found" });

    // req.body is a Buffer because route uses express.raw({ type: 'application/octet-stream' })
    const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    const path = dropboxPathFor(userId, fileId, meta.name);

    await uploadToDropbox(path, bytes);

    await File.updateOne(
      { _id: fileId },
      { $set: { status: "ready", storage: { dropboxPath: path } } }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("[uploadCiphertext] error:", e);
    if (!res.headersSent) res.status(500).json({ error: "Upload failed" });
  }
}

// ---------- DOWNLOAD CIPHERTEXT ← DROPBOX ----------
export async function downloadFile(req, res) {
  const userId = req.user.id;
  const fileId = req.params.id;
  const doc = await File.findOne({ _id: fileId, owner: userId });
  const path = doc?.storage?.dropboxPath;
  if (!doc || !path) return res.status(404).json({ error: "Not found" });

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);

  try {
    const stream = await streamFromDropbox(path);
    stream.on("error", (err) => {
      console.error("Dropbox stream error:", err);
      if (!res.headersSent) res.status(500).end("Download error");
    });
    stream.pipe(res);
  } catch (e) {
    console.error("[downloadFile] error:", e);
    if (!res.headersSent) res.status(500).json({ error: "Download failed" });
  }
}

// ---------- DELETE ----------
export async function deleteFile(req, res) {
  // If you want: also hit Dropbox delete API here.
  const userId = req.user.id;
  const fileId = req.params.id;
  const doc = await File.findOne({ _id: fileId, owner: userId });
  if (!doc) return res.status(404).json({ error: "Not found" });

  await doc.deleteOne();
  await FileKey.deleteOne({ owner: userId, file: fileId }).catch(() => {});
  res.json({ ok: true });
}