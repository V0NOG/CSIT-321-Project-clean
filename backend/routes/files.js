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
import FileModel from "../models/File.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: >
 *     Encrypted file storage. All file content is AES-256-GCM encrypted by the
 *     client before upload. The server stores only ciphertext in cloud storage
 *     and metadata in MongoDB.
 */

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List the current user's files
 *     description: >
 *       Returns a paginated list of files owned by the authenticated user.
 *       Supports search, MIME-type filtering, folder filtering, and sorting.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by file name (case-insensitive)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, document, archive, other]
 *         description: Filter by MIME type category
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Folder ID to filter by (use "root" for files not in any folder)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, size, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated file list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, listFiles);

/**
 * @swagger
 * /api/files/init:
 *   post:
 *     summary: Initialise a new file upload — returns a fileId
 *     description: >
 *       Creates a File record in "init" status and returns the fileId. The
 *       client should then call POST /api/files/:id/key to store the wrapped
 *       AES key, followed by POST /api/files/upload/:id with the ciphertext.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, size, mime, ivB64, connectorId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: report.pdf
 *               size:
 *                 type: integer
 *                 description: Plaintext file size in bytes
 *                 example: 204800
 *               mime:
 *                 type: string
 *                 example: application/pdf
 *               ivB64:
 *                 type: string
 *                 description: Base64-encoded 12-byte AES-GCM IV
 *                 example: "dGVzdGl2MTIzNDU2"
 *               connectorId:
 *                 type: string
 *                 description: StorageConnector ID to use for storage
 *               folderId:
 *                 type: string
 *                 description: Optional folder to place the file in
 *     responses:
 *       201:
 *         description: File record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                   example: 64b1c2d3e4f5a6b7c8d9e0f2
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post("/init", verifyToken, express.json(), initUpload);

/**
 * @swagger
 * /api/files/{id}/key:
 *   post:
 *     summary: Store the wrapped AES file key for the owner
 *     description: >
 *       Saves the RSA-OAEP wrapped AES-256 file encryption key. The key is
 *       wrapped with the owner's RSA public key so only they can unwrap it.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wrappedKeyB64]
 *             properties:
 *               wrappedKeyB64:
 *                 type: string
 *                 description: AES key wrapped with owner's RSA public key (base64)
 *                 example: "AQAB..."
 *     responses:
 *       200:
 *         description: Key stored
 *       400:
 *         description: Missing wrappedKeyB64
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.post("/:id/key", verifyToken, express.json(), setFileKey);

/**
 * @swagger
 * /api/files/{id}/key:
 *   get:
 *     summary: Retrieve the wrapped AES file key
 *     description: Returns the RSA-wrapped AES key for the requesting user (owner or accepted share recipient).
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: Wrapped key data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wrappedKeyB64:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Key not found
 */
router.get("/:id/key", verifyToken, getFileKey);

/**
 * @swagger
 * /api/files/upload/{id}:
 *   post:
 *     summary: Upload raw AES-GCM ciphertext for a file
 *     description: >
 *       Accepts raw binary ciphertext (Content-Type: application/octet-stream)
 *       and stores it in the configured cloud storage provider. Maximum 500 MB.
 *       The file status is updated to "ready" upon success.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID (from /api/files/init)
 *     requestBody:
 *       required: true
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *             description: Raw encrypted file bytes (max 500 MB)
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Upload complete
 *       400:
 *         description: Empty body or file not in init status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File record not found
 */
router.post(
  "/upload/:id",
  verifyToken,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  uploadCiphertext
);

/**
 * @swagger
 * /api/files/{id}/download:
 *   get:
 *     summary: Download the encrypted ciphertext for a file
 *     description: >
 *       Streams raw AES-GCM ciphertext from cloud storage. The client must
 *       fetch the wrapped key via GET /api/files/:id/key, unwrap it with their
 *       RSA private key, then decrypt the ciphertext locally.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: Raw encrypted file bytes
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.get("/:id/download", verifyToken, downloadFile);

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Rename a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
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
 *                 example: updated-report.pdf
 *     responses:
 *       200:
 *         description: Renamed file record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the file owner
 *       404:
 *         description: File not found
 */
router.put("/:id", verifyToken, express.json(), renameFile);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     description: Deletes the file record from MongoDB and removes the ciphertext from cloud storage.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the file owner
 *       404:
 *         description: File not found
 */
router.delete("/:id", verifyToken, deleteFile);

/**
 * @swagger
 * /api/files/shared:
 *   get:
 *     summary: List accepted shared files in the user's library
 *     description: Returns files that are shared copies (accepted share invites) owned by the current user.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shared file copies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to load shared files
 */
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
