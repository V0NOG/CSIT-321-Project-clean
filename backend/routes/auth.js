import express from "express";
import { register, login, googleLogin } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { JWT_SECRET } from "../config/jwt.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/google", express.json(), googleLogin);

// DEBUG: decode token without verifying signature (safe to keep or remove later)
router.get("/debug/decode", (req, res) => {
  const auth = req.headers.authorization || "";
  const tok = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!tok) return res.status(400).json({ error: "No token" });
  try {
    const [h, p] = tok.split(".");
    const header = JSON.parse(Buffer.from(h, "base64url").toString());
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    return res.json({ header, payload, haveSecret: Boolean(JWT_SECRET) });
  } catch (e) {
    return res.status(400).json({ error: "Malformed token" });
  }
});

// DEBUG: verifies with server secret; returns what /me relies on
router.get("/debug/whoami", verifyToken, (req, res) => {
  return res.json({ decoded: req.user, secretLen: (JWT_SECRET || "").length });
});

export default router;