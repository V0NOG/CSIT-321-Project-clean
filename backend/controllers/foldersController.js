// backend/controllers/foldersController.js
import Folder from "../models/Folder.js";
import File from "../models/File.js";
import mongoose from "mongoose";

export async function listFolders(req, res) {
  try {
    const items = await Folder.find({ owner: req.user.id }).sort({ name: 1 }).lean();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: "Failed to list folders" });
  }
}

export async function createFolder(req, res) {
  try {
    const { name, color } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const doc = await Folder.create({
      owner: req.user.id,
      name: String(name).trim(),
      color: color || "#6B7280",
    });
    res.status(201).json({ folder: doc });
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: "A folder with that name already exists" });
    res.status(500).json({ error: "Failed to create folder" });
  }
}

export async function renameFolder(req, res) {
  try {
    const { name, color } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const update = { name: String(name).trim() };
    if (color) update.color = color;

    const doc = await Folder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Folder not found" });
    res.json({ folder: doc });
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: "A folder with that name already exists" });
    res.status(500).json({ error: "Failed to update folder" });
  }
}

export async function deleteFolder(req, res) {
  try {
    const folderId = req.params.id;
    if (!mongoose.isValidObjectId(folderId)) return res.status(400).json({ error: "Invalid folder id" });

    const doc = await Folder.findOneAndDelete({ _id: folderId, owner: req.user.id });
    if (!doc) return res.status(404).json({ error: "Folder not found" });

    // Move files back to root
    await File.updateMany({ owner: req.user.id, folder: folderId }, { $set: { folder: null } });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete folder" });
  }
}

export async function moveFileToFolder(req, res) {
  try {
    const { fileId } = req.params;
    const { folderId } = req.body || {};

    if (!mongoose.isValidObjectId(fileId)) return res.status(400).json({ error: "Invalid file id" });

    const folder = folderId
      ? await Folder.findOne({ _id: folderId, owner: req.user.id })
      : null;

    if (folderId && !folder) return res.status(404).json({ error: "Folder not found" });

    const updated = await File.findOneAndUpdate(
      { _id: fileId, owner: req.user.id },
      { $set: { folder: folder?._id || null } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "File not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to move file" });
  }
}
