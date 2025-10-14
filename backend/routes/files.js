// backend/routes/files.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listFiles,
  initUpload,
  setFileKey,
  getFileKey,
  uploadCiphertext,
  downloadFile,
  renameFile,
  deleteFile,
} from "../controllers/filesController.js";
import FileModel from "../models/File.js"; // ⬅️ alias to avoid global File clash

const router = express.Router();

// List, upload init, key mgmt
router.get("/", verifyToken, listFiles);
router.post("/init", verifyToken, express.json(), initUpload);

router.post("/:id/key", verifyToken, express.json(), setFileKey);
router.get("/:id/key", verifyToken, getFileKey);

// Raw ciphertext (client-encrypted)
router.post(
  "/upload/:id",
  verifyToken,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  uploadCiphertext
);

// Download, rename, delete
router.get("/:id/download", verifyToken, downloadFile);
router.put("/:id", verifyToken, express.json(), renameFile);
router.delete("/:id", verifyToken, deleteFile);

// Files that are *shared copies* in my library (accepted invites copied into my account)
router.get("/shared", verifyToken, async (req, res) => {
  try {
    const items = await FileModel.find({
      owner: req.user.id,
      isSharedCopy: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (e) {
    console.error("[files] /shared:", e);
    res.status(500).json({ error: "Failed to load shared files" });
  }
});

export default router;