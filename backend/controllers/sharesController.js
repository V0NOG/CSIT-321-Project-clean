// backend/controllers/sharesController.js
import Share from "../models/Share.js";
import SharedFileKey from "../models/SharedFileKey.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import File from "../models/File.js";

// Helper: pull the "owner" id from a File document (defensive against different field names)
function getOwnerIdFromFileDoc(fileDoc) {
  return (
    fileDoc?.owner ||
    fileDoc?.uploadedBy ||
    fileDoc?.uploader ||
    fileDoc?.user ||
    fileDoc?.userId ||
    null
  );
}

// Ensure requester owns the file
async function assertOwnsFile(userId, fileId) {
  if (!mongoose.isValidObjectId(fileId)) {
    const err = new Error("Invalid file id");
    err.status = 400;
    throw err;
  }

  const file = await File.findById(fileId).select("_id name owner uploadedBy uploader user userId");
  if (!file) {
    const err = new Error("File not found");
    err.status = 404;
    throw err;
  }

  const ownerId = getOwnerIdFromFileDoc(file);
  if (!ownerId || ownerId.toString() !== userId.toString()) {
    const err = new Error("Not authorized to manage shares for this file");
    err.status = 403;
    throw err;
  }

  return file;
}

// GET /api/shares/file/:fileId  (owner only)
export async function listForFile(req, res) {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;

    await assertOwnsFile(userId, fileId);

    const items = await Share.find({ file: fileId, owner: userId })
      .select("_id targetUser targetEmail permission status createdAt")
      .populate("targetUser", "email firstName lastName");

    const normalized = items.map((s) => ({
      _id: s._id,
      email: s.targetEmail || s.targetUser?.email || "",
      permission: s.permission,
      status: s.status,
      createdAt: s.createdAt,
    }));

    res.json({ items: normalized });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Failed to list shares" });
  }
}

// GET /api/shares/mine/list?includePending=0|1 (shares *accepted* by default)
export async function listSharedWithMe(req, res) {
  try {
    const me = req.user.id;
    const includePending = String(req.query.includePending || "0") === "1";

    const myUser = await User.findById(me).select("email");
    const myEmail = myUser?.email?.toLowerCase();

    const orTarget = [{ targetUser: me }];
    if (myEmail) orTarget.push({ targetEmail: myEmail });

    const query = {
      $and: [
        { $or: orTarget },
        includePending ? { status: { $in: ["pending", "accepted"] } } : { status: "accepted" },
      ],
    };

    const items = await Share.find(query)
      .select("_id file permission status createdAt owner")
      .populate("file", "name mime size createdAt owner")
      .populate("owner", "firstName lastName email");

    // Only return shares where file still exists
    const filtered = items.filter((s) => !!s.file);

    res.json({
      items: filtered.map((s) => ({
        _id: s._id,
        fileId: s.file._id,
        fileName: s.file.name,
        mime: s.file.mime,
        size: s.file.size,
        permission: s.permission,
        status: s.status,
        owner: {
          id: s.owner?._id,
          name: `${s.owner?.firstName || ""} ${s.owner?.lastName || ""}`.trim(),
          email: s.owner?.email,
        },
        createdAt: s.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to list your shares" });
  }
}

// POST /api/shares/:fileId   { email, permission, note }
export async function createShare(req, res) {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;
    const { email, permission, note } = req.body || {};

    const file = await assertOwnsFile(userId, fileId);

    if (!email) return res.status(400).json({ error: "Email is required" });
    const perm = permission === "editor" ? "editor" : "viewer";

    const targetEmail = String(email).toLowerCase().trim();
    const targetUser = await User.findOne({ email: targetEmail }).select("_id email pubKey");

    // Prevent sharing to yourself
    if (targetUser && targetUser._id.toString() === userId.toString()) {
      return res.status(400).json({ error: "Cannot share to yourself" });
    }

    const where = targetUser
      ? { file: fileId, owner: userId, targetUser: targetUser._id }
      : { file: fileId, owner: userId, targetEmail };

    const update = {
      $set: {
        permission: perm,
        targetEmail,
        targetUser: targetUser?._id || undefined,
        note: note?.slice(0, 500) || undefined,
        status: "pending",
        keyProvided: false,
      },
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const doc = await Share.findOneAndUpdate(where, update, opts);

    res.status(201).json({
      message: "Invite sent",
      share: {
        _id: doc._id,
        email: targetEmail,
        permission: doc.permission,
        status: doc.status,
        file: { id: file._id, name: file.name },
        // Return recipient info so client can do ZK key-wrapping
        targetUserId: targetUser?._id?.toString() || null,
        targetUserPubKey: targetUser?.pubKey || null,
      },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Already invited this recipient" });
    }
    res.status(500).json({ error: e.message || "Failed to create share" });
  }
}

// POST /api/shares/:shareId/filekey  — owner uploads re-wrapped key for recipient
export async function saveSharedKey(req, res) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;
    const { wrappedKeyB64 } = req.body || {};

    if (!wrappedKeyB64) return res.status(400).json({ error: "wrappedKeyB64 required" });

    const share = await Share.findById(shareId).populate("file", "owner");
    if (!share) return res.status(404).json({ error: "Share not found" });

    // Only the file owner may provide the key
    if (share.file?.owner?.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await SharedFileKey.findOneAndUpdate(
      { share: shareId },
      {
        $set: {
          share: shareId,
          file: share.file._id,
          senderUser: userId,
          recipientUser: share.targetUser || undefined,
          wrappedKeyB64,
        },
      },
      { upsert: true, new: true }
    );

    // Mark the share as having a key provided
    await Share.updateOne({ _id: shareId }, { $set: { keyProvided: true } });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save shared key" });
  }
}

// GET /api/shares/:shareId/filekey  — recipient retrieves their wrapped key
export async function getSharedKey(req, res) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;

    const share = await Share.findById(shareId);
    if (!share) return res.status(404).json({ error: "Share not found" });

    // Verify requester is the recipient
    const myUser = await User.findById(userId).select("email");
    const myEmail = myUser?.email?.toLowerCase();
    const isRecipient =
      (share.targetUser && share.targetUser.toString() === userId.toString()) ||
      (myEmail && share.targetEmail === myEmail);

    if (!isRecipient) return res.status(403).json({ error: "Not authorized" });

    const keyDoc = await SharedFileKey.findOne({ share: shareId }).lean();
    if (!keyDoc) return res.status(404).json({ error: "Key not yet provided" });

    res.json({ wrappedKeyB64: keyDoc.wrappedKeyB64, fileId: share.file?.toString() });
  } catch (e) {
    res.status(500).json({ error: "Failed to get shared key" });
  }
}

// PUT /api/shares/:shareId   { permission } (owner can edit permission)
export async function updateShare(req, res) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;
    const { permission } = req.body || {};

    const doc = await Share.findById(shareId);
    if (!doc) return res.status(404).json({ error: "Share not found" });

    await assertOwnsFile(userId, doc.file);

    const perm = permission === "editor" ? "editor" : "viewer";
    doc.permission = perm;
    await doc.save();

    res.json({ message: "Updated", share: { _id: doc._id, permission: doc.permission } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update share" });
  }
}

// DELETE /api/shares/:shareId  (owner revokes)
export async function revokeShare(req, res) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;

    const doc = await Share.findById(shareId);
    if (!doc) return res.status(404).json({ error: "Share not found" });

    await assertOwnsFile(userId, doc.file);

    await Share.deleteOne({ _id: shareId });
    res.json({ message: "Share revoked" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to revoke share" });
  }
}

// ---------- Recipient actions ----------

// GET /api/shares/inbox (pending invites for me)
export async function inbox(req, res) {
  try {
    const me = req.user.id;
    const myUser = await User.findById(me).select("email");
    const myEmail = myUser?.email?.toLowerCase();

    const orTarget = [{ targetUser: me }];
    if (myEmail) orTarget.push({ targetEmail: myEmail });

    const items = await Share.find({
      $and: [{ $or: orTarget }, { status: "pending" }],
    })
      .select("_id file permission status createdAt owner note")
      .populate("file", "name mime size createdAt owner")
      .populate("owner", "firstName lastName email");

    const normalized = items
      .filter((s) => !!s.file)
      .map((s) => ({
        _id: s._id,
        fileId: s.file._id,
        fileName: s.file.name,
        permission: s.permission,
        status: s.status,
        note: s.note,
        owner: {
          id: s.owner?._id,
          name: `${s.owner?.firstName || ""} ${s.owner?.lastName || ""}`.trim(),
          email: s.owner?.email,
        },
        createdAt: s.createdAt,
      }));

    res.json({ items: normalized });
  } catch (e) {
    res.status(500).json({ error: "Failed to load inbox" });
  }
}

// POST /api/shares/:shareId/accept
export async function accept(req, res) {
  try {
    const me = req.user.id;
    const { shareId } = req.params;

    const doc = await Share.findById(shareId).populate("file", "owner name");
    if (!doc) return res.status(404).json({ error: "Invite not found" });

    // only recipient can accept
    const myUser = await User.findById(me).select("email");
    const myEmail = myUser?.email?.toLowerCase();
    const isRecipient =
      (doc.targetUser && doc.targetUser.toString() === me.toString()) ||
      (!!myEmail && doc.targetEmail === myEmail);

    if (!isRecipient) return res.status(403).json({ error: "Not authorized" });
    if (doc.status === "declined") return res.status(400).json({ error: "Invite already declined" });

    doc.status = "accepted";
    await doc.save();

    res.json({ message: "Invite accepted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to accept invite" });
  }
}

// POST /api/shares/:shareId/decline
export async function decline(req, res) {
  try {
    const me = req.user.id;
    const { shareId } = req.params;

    const doc = await Share.findById(shareId);
    if (!doc) return res.status(404).json({ error: "Invite not found" });

    const myUser = await User.findById(me).select("email");
    const myEmail = myUser?.email?.toLowerCase();
    const isRecipient =
      (doc.targetUser && doc.targetUser.toString() === me.toString()) ||
      (!!myEmail && doc.targetEmail === myEmail);

    if (!isRecipient) return res.status(403).json({ error: "Not authorized" });

    // Either mark declined or delete; we’ll mark declined so owner can see outcome
    doc.status = "declined";
    await doc.save();

    res.json({ message: "Invite declined" });
  } catch (e) {
    res.status(500).json({ error: "Failed to decline invite" });
  }
}