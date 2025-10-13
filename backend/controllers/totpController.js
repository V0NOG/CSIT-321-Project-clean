// backend/controllers/totpController.js
import User from "../models/User.js";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { sealSecret, openSecret } from "../services/crypto.js";

const APP_ISSUER = "CSIT321-Vault";

export const totpSetup = async (req, res) => {
  // Create a new secret for the logged-in user, but DON'T enable yet
  const user = await User.findById(req.user.id).select("_id email");
  if (!user) return res.status(404).json({ error: "User not found" });

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, APP_ISSUER, secret);
  const qr = await qrcode.toDataURL(otpauth);

  // Return secret TEMPORARILY to client so they can show QR & verify code.
  // We don't store it until they verify a code.
  res.json({ otpauth, qr, tempSecret: secret });
};

export const totpEnable = async (req, res) => {
  const { tempSecret, code } = req.body || {};
  if (!tempSecret || !code) return res.status(400).json({ error: "Missing fields" });

  const isValid = authenticator.check(code, tempSecret);
  if (!isValid) return res.status(400).json({ error: "Invalid code" });

  const enc = sealSecret(tempSecret);
  await User.findByIdAndUpdate(req.user.id, {
    $set: { totpEnabled: true, totpSecretEnc: enc }
  });

  res.json({ message: "TOTP enabled" });
};

export const totpDisable = async (req, res) => {
  // Optional: require a current TOTP code for safety
  const { code } = req.body || {};
  const user = await User.findById(req.user.id).select("totpEnabled totpSecretEnc");
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.totpEnabled) return res.json({ message: "TOTP already disabled" });

  const secret = openSecret(user.totpSecretEnc);
  const ok = code ? authenticator.check(code, secret) : true;
  if (!ok) return res.status(400).json({ error: "Invalid code" });

  await User.findByIdAndUpdate(req.user.id, {
    $set: { totpEnabled: false },
    $unset: { totpSecretEnc: 1 }
  });
  res.json({ message: "TOTP disabled" });
};

// Helper to use inside your login flow (gate after password check)
export async function verifyTotpIfEnabled(userId, code) {
  const user = await User.findById(userId).select("totpEnabled totpSecretEnc");
  if (!user?.totpEnabled) return true;
  if (!code) return false;
  const secret = openSecret(user.totpSecretEnc);
  return authenticator.check(code, secret);
}