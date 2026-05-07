// backend/routes/folders.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { listFolders, createFolder, renameFolder, deleteFolder, moveFileToFolder } from "../controllers/foldersController.js";

const router = express.Router();

router.use(verifyToken);
router.get("/", listFolders);
router.post("/", express.json(), createFolder);
router.put("/:id", express.json(), renameFolder);
router.delete("/:id", deleteFolder);

// Move a file into a folder
router.put("/files/:fileId/move", express.json(), moveFileToFolder);

export default router;
