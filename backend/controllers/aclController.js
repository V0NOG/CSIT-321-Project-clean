// backend/controllers/aclController.js
import { z } from "zod";
import File from "../models/File.js";
import FileKey from "../models/FileKey.js";
import User from "../models/User.js";
import { appendAudit } from "../services/audit.js";

const AclUpsertSchema = z.object({
  recipientId: z.string().optional(),
  externalEmail: z.string().email().optional(),
  role: z.enum(["owner", "writer", "reader"]).default("reader"),
  wrappedFileKey: z.string().min(1),
});

export const getAcl = async (req, res) => {
  const fileId = req.params.id;
  const acl = await FileKey.find({ fileId }).select("-__v");
  res.json(acl);
};

export const upsertAcl = async (req, res) => {
  try {
    const fileId = req.params.id;
    const data = AclUpsertSchema.parse(req.body);

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (String(file.ownerId) !== req.user.id) return res.status(403).json({ error: "Not owner" });

    // resolve recipient
    let recipientId = data.recipientId || null;
    if (!recipientId && data.externalEmail) {
      const u = await User.findOne({ email: data.externalEmail.toLowerCase() }).select("_id");
      recipientId = u?._id || null;
    }

    const doc = await FileKey.findOneAndUpdate(
      { fileId, ...(recipientId ? { recipientId } : { externalEmail: data.externalEmail }) },
      {
        $set: {
          wrappedFileKey: data.wrappedFileKey,
          role: data.role,
          addedBy: req.user.id,
        },
      },
      { new: true, upsert: true }
    );

    await appendAudit({
      actorId: req.user.id,
      action: "acl:upsert",
      target: String(fileId),
      meta: { recipientId: recipientId || data.externalEmail, role: data.role },
    });

    res.json(doc);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.message });
    res.status(500).json({ error: "ACL update failed" });
  }
};

export const removeAcl = async (req, res) => {
  const fileId = req.params.id;
  const keyId = req.params.keyId;

  const file = await File.findById(fileId);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (String(file.ownerId) !== req.user.id) return res.status(403).json({ error: "Not owner" });

  await FileKey.deleteOne({ _id: keyId, fileId });
  await appendAudit({ actorId: req.user.id, action: "acl:remove", target: String(fileId), meta: { keyId } });
  res.json({ message: "Removed" });
};