// backend/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Accepts access token from:
 *  - Authorization: Bearer <token>
 *  - cookies.accessToken (httpOnly cookie)
 * Verifies with JWT_ACCESS_SECRET (falls back to JWT_SECRET)
 * Normalizes req.user to { id, role, raw }
 */
export const verifyToken = (req, res, next) => {
  // Prefer header, fall back to cookie
  const auth =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.get?.("Authorization");

  let token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const ACCESS_SECRET =
    (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "").trim();

  if (!ACCESS_SECRET) {
    console.error("[auth] Missing JWT_ACCESS_SECRET/JWT_SECRET");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    // Our controller signs: { sub: userId, role }
    // Normalize to req.user.id for downstream code
    req.user = {
      id: payload.sub || payload.id,
      role: payload.role,
      raw: payload,
    };
    if (!req.user.id) {
      // Extremely defensive: if no id after normalization
      return res.status(403).json({ message: "Invalid token payload." });
    }
    return next();
  } catch (error) {
    console.warn("[auth] verify failed:", error?.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access required." });
};