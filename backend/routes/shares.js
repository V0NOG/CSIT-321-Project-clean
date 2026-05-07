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

// All routes require auth
router.use(verifyToken);

// Owner management
router.get("/file/:fileId", listForFile);
router.post("/:fileId", express.json(), createShare);
router.put("/:shareId", express.json(), updateShare);
router.delete("/:shareId", revokeShare);

// ZK file key sharing — owner saves key, recipient retrieves it
router.post("/:shareId/filekey", express.json(), saveSharedKey);
router.get("/:shareId/filekey", getSharedKey);

// Recipient views
router.get("/mine/list", listSharedWithMe);
router.get("/inbox", inbox);

// Recipient actions
router.post("/:shareId/accept", accept);
router.post("/:shareId/decline", decline);

/**
 * 🔹 NEW: Pending invites used by the dashboard tile
 * GET /api/shares/mine/pending
 * Returns an array of pending invites for the current user.
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
 * Unified respond endpoint (accept/decline) used by some frontends
 * POST /api/shares/:id/respond  { action: "accept" | "decline" }
 * On accept, copies the file metadata into recipient's library as a shared copy.
 */
router.post("/:id/respond", express.json(), async (req, res) => {
  try {
    const { action } = req.body || {};
    const share = await Share.findById(req.params.id).populate("file");
    if (!share) return res.status(404).json({ error: "Share not found" });

    const me = await User.findById(req.user.id).select("_id email");
    const myEmail = me?.email?.toLowerCase?.();

    // Must match recipient by user or email
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

      // Mark share accepted — no file copy needed; recipient downloads via the share record
      // (The file key for the recipient is stored in SharedFileKey)

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