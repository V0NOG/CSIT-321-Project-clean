import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listFiles,
  initUpload,
  uploadCiphertext,
  downloadFile,
  deleteFile,
  setFileKey,
  getFileKey,
} from "../controllers/filesController.js";

const router = express.Router();

router.get("/", verifyToken, listFiles);
router.post("/init", verifyToken, express.json(), initUpload);

// key endpoints
router.post("/:id/key", verifyToken, express.json(), setFileKey);
router.get("/:id/key", verifyToken, getFileKey);

// raw ciphertext upload
router.post(
  "/upload/:id",
  verifyToken,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  uploadCiphertext
);

// download ciphertext
router.get("/:id/download", verifyToken, downloadFile);

router.delete("/:id", verifyToken, deleteFile);

export default router;