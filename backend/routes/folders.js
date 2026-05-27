// backend/routes/folders.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { listFolders, createFolder, renameFolder, deleteFolder, moveFileToFolder } from "../controllers/foldersController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Folders
 *   description: Virtual folder organisation for encrypted files
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: List all folders for the current user
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of folders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 folders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Folder'
 *       401:
 *         description: Unauthorized
 */
router.get("/", listFolders);

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Work Documents
 *               color:
 *                 type: string
 *                 description: Hex colour code for the folder icon
 *                 example: "#3B82F6"
 *     responses:
 *       201:
 *         description: Folder created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Missing name or name already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/", express.json(), createFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     summary: Rename a folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Folder ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Personal Documents
 *               color:
 *                 type: string
 *                 example: "#10B981"
 *     responses:
 *       200:
 *         description: Updated folder
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 */
router.put("/:id", express.json(), renameFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Delete a folder
 *     description: Deletes the folder. Files inside the folder are moved to the root (no folder) rather than deleted.
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Folder ID
 *     responses:
 *       200:
 *         description: Folder deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 */
router.delete("/:id", deleteFolder);

/**
 * @swagger
 * /api/folders/files/{fileId}/move:
 *   put:
 *     summary: Move a file into a folder (or remove it from all folders)
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID to move
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 description: Target folder ID. Pass null to move file to root.
 *                 example: 64b1c2d3e4f5a6b7c8d9e0f3
 *     responses:
 *       200:
 *         description: File moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File or folder not found
 */
router.put("/files/:fileId/move", express.json(), moveFileToFolder);

export default router;
