// backend/routes/shares.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Share from "../models/Share.js";
import User from "../models/User.js";
import FileModel from "../models/File.js";
import {
  listForFile,
  createShare,
  updateShare,
  revokeShare,
  listSharedWithMe,
  inbox,
  accept,
  decline,
  saveSharedKey,
  getSharedKey,
} from "../controllers/sharesController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shares
 *   description: >
 *     Zero-knowledge file sharing. The file owner wraps the AES file key with
 *     the recipient's RSA public key so the server never sees the plaintext key.
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/shares/file/{fileId}:
 *   get:
 *     summary: List all shares for a specific file (owner view)
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: List of share records for this file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shares:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Share'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the file owner
 */
router.get("/file/:fileId", listForFile);

/**
 * @swagger
 * /api/shares/{fileId}:
 *   post:
 *     summary: Create a share invitation for a file
 *     description: >
 *       Sends a share invitation to a registered user (by userId) or any email
 *       address. The share starts in "pending" status. The recipient must accept
 *       it before gaining access. After creating the share, call
 *       POST /api/shares/:shareId/filekey to supply the wrapped file key.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 description: MongoDB user ID of the recipient
 *               targetEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address for external invite
 *               permission:
 *                 type: string
 *                 enum: [viewer, editor]
 *                 default: viewer
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional message to the recipient
 *     responses:
 *       201:
 *         description: Share created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Share'
 *       400:
 *         description: Missing target or file already shared with this user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the file owner
 */
router.post("/:fileId", express.json(), createShare);

/**
 * @swagger
 * /api/shares/{shareId}:
 *   put:
 *     summary: Update a share (change permission or note)
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [viewer, editor]
 *               note:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Updated share record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Share'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Share not found
 */
router.put("/:shareId", express.json(), updateShare);

/**
 * @swagger
 * /api/shares/{shareId}:
 *   delete:
 *     summary: Revoke a share
 *     description: Deletes the share record and associated wrapped key. The recipient immediately loses access.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share revoked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the share owner
 *       404:
 *         description: Share not found
 */
router.delete("/:shareId", revokeShare);

/**
 * @swagger
 * /api/shares/{shareId}/filekey:
 *   post:
 *     summary: Save the wrapped file key for the share recipient (ZK step)
 *     description: >
 *       The share owner calls this after creating a share. They wrap the file's
 *       AES key with the recipient's RSA-OAEP public key and upload the result
 *       here. This completes the zero-knowledge handoff.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: AES key wrapped with recipient's RSA public key (base64)
 *     responses:
 *       200:
 *         description: Key saved
 *       400:
 *         description: Missing wrappedKeyB64
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Share not found
 */
router.post("/:shareId/filekey", express.json(), saveSharedKey);

/**
 * @swagger
 * /api/shares/{shareId}/filekey:
 *   get:
 *     summary: Get the wrapped file key for an accepted share (recipient)
 *     description: Returns the AES key wrapped with the recipient's RSA public key.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
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
 *       403:
 *         description: Not the share recipient
 *       404:
 *         description: Key not found
 */
router.get("/:shareId/filekey", getSharedKey);

/**
 * @swagger
 * /api/shares/mine/list:
 *   get:
 *     summary: List files shared with the current user (accepted shares)
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accepted shares
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shares:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Share'
 *       401:
 *         description: Unauthorized
 */
router.get("/mine/list", listSharedWithMe);

/**
 * @swagger
 * /api/shares/inbox:
 *   get:
 *     summary: Get all pending share invitations (inbox)
 *     description: Returns pending invitations sent to the user by ID or email.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending share invitations with file metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Share'
 *       401:
 *         description: Unauthorized
 */
router.get("/inbox", inbox);

/**
 * @swagger
 * /api/shares/{shareId}/accept:
 *   post:
 *     summary: Accept a share invitation
 *     description: Marks the share as accepted. The file becomes accessible using the wrapped key from /filekey.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share accepted
 *       400:
 *         description: Invite already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the share recipient
 *       404:
 *         description: Share not found
 */
router.post("/:shareId/accept", accept);

/**
 * @swagger
 * /api/shares/{shareId}/decline:
 *   post:
 *     summary: Decline a share invitation
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share declined
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the share recipient
 */
router.post("/:shareId/decline", decline);

/**
 * @swagger
 * /api/shares/mine/pending:
 *   get:
 *     summary: List pending share invitations for the dashboard
 *     description: Returns a condensed list of pending share invitations (file name + permission only).
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   fileId:
 *                     type: string
 *                   fileName:
 *                     type: string
 *                   permission:
 *                     type: string
 *                     enum: [viewer, editor]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/mine/pending", async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("_id email");
    const email = me?.email?.toLowerCase?.() || "";

    const pending = await Share.find({
      status: "pending",
      $or: [
        { targetUser: req.user.id },
        ...(email ? [{ targetEmail: email }] : []),
      ],
    })
      .populate("file", "name size mime")
      .sort({ createdAt: -1 })
      .lean();

    const items = pending.map((p) => ({
      _id: p._id,
      fileId: p.file?._id,
      fileName: p.file?.name || "(deleted file)",
      permission: p.permission,
      createdAt: p.createdAt,
    }));

    res.json(items);
  } catch (e) {
    console.error("[shares] /mine/pending:", e);
    res.status(500).json({ error: "Failed to load pending invites" });
  }
});

/**
 * @swagger
 * /api/shares/{id}/respond:
 *   post:
 *     summary: Unified accept/decline endpoint
 *     description: >
 *       Accepts or declines a share invitation based on the "action" field.
 *       On accept, the share status is set to "accepted". The recipient can
 *       then download the file using the wrapped key stored via /filekey.
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Share ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, decline]
 *                 example: accept
 *     responses:
 *       200:
 *         description: Invite accepted or declined
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 shareId:
 *                   type: string
 *                 fileId:
 *                   type: string
 *       400:
 *         description: Invalid action or invite already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the share recipient
 *       404:
 *         description: Share not found
 */
router.post("/:id/respond", express.json(), async (req, res) => {
  try {
    const { action } = req.body || {};
    const share = await Share.findById(req.params.id).populate("file");
    if (!share) return res.status(404).json({ error: "Share not found" });

    const me = await User.findById(req.user.id).select("_id email");
    const myEmail = me?.email?.toLowerCase?.();

    const isRecipient =
      (share.targetUser && String(share.targetUser) === String(me._id)) ||
      (myEmail && share.targetEmail?.toLowerCase?.() === myEmail);

    if (!isRecipient) return res.status(403).json({ error: "Not authorized for this share" });
    if (share.status !== "pending") {
      return res.status(400).json({ error: "Invite already processed" });
    }

    if (action === "decline") {
      share.status = "declined";
      share.declinedAt = new Date();
      await share.save();
      return res.json({ message: "Invite declined" });
    }

    if (action === "accept") {
      if (!share.file) {
        share.status = "declined";
        await share.save();
        return res.status(404).json({ error: "Original file no longer exists" });
      }

      share.status = "accepted";
      await share.save();

      return res.json({ message: "Invite accepted", shareId: share._id, fileId: share.file._id });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (e) {
    console.error("[shares] respond:", e);
    res.status(500).json({ error: "Failed to process invite" });
  }
});

export default router;
