import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/user/me
 * Returns the current user (safe fields only).
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -totpSecretEnc -encPrivKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    // user.totpEnabled is included, which is what the profile & 2FA card need
    res.json(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * PUT /api/user/me
 * Update safe user fields. (Prevents role/password edits here.)
 */
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { role, password, totpSecretEnc, encPrivKey, ...rest } = req.body || {};
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: rest },
      { new: true }
    ).select("-password -totpSecretEnc -encPrivKey");
    res.json(updated);
  } catch (err) {
    console.error("PUT /me error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * (Optional) GET /api/user/mfa
 * A tiny endpoint your Profile’s TwoFactorCard can hit for status-only checks.
 */
router.get("/mfa", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("totpEnabled");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ totpEnabled: !!user.totpEnabled });
  } catch (err) {
    console.error("GET /mfa error:", err);
    res.status(500).json({ error: "Failed to fetch MFA status" });
  }
});

export default router;