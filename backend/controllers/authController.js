import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// TOTP: guard against module or runtime errors so login never 500s from this
let verifyTotpIfEnabled = async () => true;
try {
  const mod = await import("./totpController.js");
  if (typeof mod.verifyTotpIfEnabled === "function") {
    verifyTotpIfEnabled = mod.verifyTotpIfEnabled;
  }
} catch (e) {
  console.warn("[auth] TOTP module not available, continuing without TOTP.");
}

// ---------- Validation ----------
const RegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  password:  z.string().min(8),
  phone:     z.string().optional(),
  bio:       z.string().optional(),
  address:   z.object({
    country: z.string().optional(),
    cityState: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  role: z.enum(["admin", "staff"]).optional(),
  pubKey:     z.string().optional(),
  encPrivKey: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

// ---------- Secrets & helpers ----------
const ACCESS_SECRET  = (process.env.JWT_ACCESS_SECRET  || process.env.JWT_SECRET || "").trim();
const REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "").trim();
const ACCESS_TTL     = process.env.ACCESS_TOKEN_TTL  || "15m";
const REFRESH_TTL    = process.env.REFRESH_TOKEN_TTL || "7d";

function ensureSecretsOrThrow() {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    const hint = "[auth] Missing JWT secrets. Define JWT_ACCESS_SECRET and JWT_REFRESH_SECRET, or JWT_SECRET as fallback.";
    console.error(hint);
    const err = new Error(hint);
    err.code = "NO_JWT_SECRET";
    throw err;
  }
}

const signAccess  = (payload) => jwt.sign(payload, ACCESS_SECRET,  { expiresIn: ACCESS_TTL });
const signRefresh = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const setAuthCookies = (res, accessToken, refreshToken) => {
  const common = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    domain: process.env.COOKIE_DOMAIN || "localhost",
    path: "/",
  };
  res.cookie("accessToken", accessToken, { ...common, maxAge: 1000 * 60 * 15 });
  res.cookie("refreshToken", refreshToken, { ...common, maxAge: 1000 * 60 * 60 * 24 * 7 });
};

const clearAuthCookies = (res) => {
  const opts = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    domain: process.env.COOKIE_DOMAIN || "localhost",
    path: "/",
  };
  res.clearCookie("accessToken", opts);
  res.clearCookie("refreshToken", opts);
};

// ---------- Controllers ----------
export const register = async (req, res) => {
  try {
    ensureSecretsOrThrow();

    const data = RegisterSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      ...data,
      email,
      password: hashedPassword,
    });

    const accessToken = signAccess({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefresh({
      sub: user._id.toString(),
      role: user.role,
      ver: user.tokenVersion, // ok if undefined
    });
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      message: "User created",
      token: accessToken, // SPA bearer option
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors.map(e => e.message).join(", ") });
    }
    if (err?.code === "NO_JWT_SECRET") {
      return res.status(500).json({ error: "Server misconfiguration: JWT secret(s) missing" });
    }
    console.error("[register] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    ensureSecretsOrThrow();

    const { email, password, totpCode } = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // TOTP gate with hardening — never throw a 500 from here
    let totpOk = true;
    try {
      totpOk = await verifyTotpIfEnabled(user._id, totpCode);
    } catch (e) {
      console.warn("[auth] TOTP verify threw:", e?.message || e);
      // If you want to *require* TOTP when enabled, set totpOk = false instead:
      // totpOk = false;
    }
    if (!totpOk) return res.status(401).json({ error: "TOTP required or invalid" });

    const accessToken = signAccess({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefresh({
      sub: user._id.toString(),
      role: user.role,
      ver: user.tokenVersion,
    });
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      message: "Logged in",
      token: accessToken, // SPA bearer option
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors.map(e => e.message).join(", ") });
    }
    if (err?.code === "NO_JWT_SECRET") {
      return res.status(500).json({ error: "Server misconfiguration: JWT secret(s) missing" });
    }
    console.error("[login] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    ensureSecretsOrThrow();

    const cookieToken = req.cookies?.refreshToken;
    let token = cookieToken;
    if (!token) {
      const auth = req.headers.authorization || "";
      token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    }
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = jwt.verify(token, REFRESH_SECRET); // throws if invalid/expired
    const user = await User.findById(payload.sub).select("_id role tokenVersion");
    if (!user) return res.status(401).json({ error: "Invalid refresh" });

    if (payload.ver !== user.tokenVersion) {
      return res.status(401).json({ error: "Refresh token invalidated" });
    }

    const accessToken = signAccess({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefresh({
      sub: user._id.toString(),
      role: user.role,
      ver: user.tokenVersion,
    });

    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ message: "Refreshed", token: accessToken });
  } catch (err) {
    console.warn("[refresh] error:", err?.message || err);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

export const logout = async (_req, res) => {
  clearAuthCookies(res);
  return res.json({ message: "Logged out" });
};

export const logoutAll = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await User.findById(userId).select("_id tokenVersion");
  if (!user) return res.status(404).json({ error: "User not found" });

  const nextVersion = (user.tokenVersion || 0) + 1;
  await User.findByIdAndUpdate(userId, { $set: { tokenVersion: nextVersion } });

  clearAuthCookies(res);
  return res.json({ message: "Logged out of all devices" });
};