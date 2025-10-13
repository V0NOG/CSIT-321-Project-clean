import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", verifyToken, async (req, res) => {
  try {
    // console.log("ME req.user:", req.user); // debug
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/me", verifyToken, async (req, res) => {
  try {
    // prevent role/password edits here unless you explicitly allow & validate them
    const { role, password, ...rest } = req.body || {};
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: rest },
      { new: true }
    ).select("-password -totpSecretEnc -encPrivKey");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;