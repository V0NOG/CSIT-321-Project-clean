// backend/controllers/keysController.js
import User from "../models/User.js";
import { z } from "zod";

export const getPublicKey = async (req, res) => {
  const userId = req.params.userId || req.user?.id;
  const user = await User.findById(userId).select("pubKey");
  if (!user?.pubKey) return res.status(404).json({ error: "Public key not set" });
  res.json({ pubKey: user.pubKey });
};

// GET /api/keys/me  — returns own pubKey + encPrivKey so the client can decrypt the private key
export const getMyKeys = async (req, res) => {
  const user = await User.findById(req.user.id).select("pubKey encPrivKey");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ pubKey: user.pubKey || null, encPrivKey: user.encPrivKey || null });
};

const RotateSchema = z.object({
  pubKey: z.string().min(1),      // PEM/JWK/Base64 — your choice
  encPrivKey: z.string().min(1),  // encrypted private key blob
});

export const rotateKeys = async (req, res) => {
  try {
    const data = RotateSchema.parse(req.body);
    await User.findByIdAndUpdate(req.user.id, {
      $set: { pubKey: data.pubKey, encPrivKey: data.encPrivKey },
    });
    res.json({ message: "Keys updated" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors.map(x => x.message).join(", ") });
    }
    return res.status(500).json({ error: "Failed to rotate keys" });
  }
};