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
} from "../controllers/filesController.js";

const router = express.Router();

router.get("/", verifyToken, listFiles);
router.post("/init", verifyToken, express.json(), initUpload);

router.post("/:id/key", verifyToken, express.json(), setFileKey);
router.get("/:id/key", verifyToken, getFileKey);

// raw ciphertext (client-encrypted)
router.post(
  "/upload/:id",
  verifyToken,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  uploadCiphertext
);

router.get("/:id/download", verifyToken, downloadFile);

export default router;