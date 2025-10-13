// backend/routes/files.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listFiles,
  initUpload,
  uploadCiphertext,
  downloadFile,
  deleteFile,
} from "../controllers/filesController.js";

const router = express.Router();

// List (paginated + filter + search + sort)
router.get("/", verifyToken, listFiles);

// Metadata init
router.post("/init", verifyToken, express.json(), initUpload);

// Raw ciphertext upload (use express.raw specifically for this route)
router.post(
  "/upload/:id",
  verifyToken,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  uploadCiphertext
);

// Download
router.get("/:id/download", verifyToken, downloadFile);

// Delete (optional)
router.delete("/:id", verifyToken, deleteFile);

export default router;