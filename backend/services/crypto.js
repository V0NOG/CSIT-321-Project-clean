// backend/services/crypto.js
import crypto from "crypto";

const encKeyB64 = process.env.TOTP_ENC_KEY || ""; // 32 bytes (base64 or hex)
const getKey = () => {
  if (!encKeyB64) throw new Error("TOTP_ENC_KEY missing");
  // accept base64 or hex
  if (/^[A-Fa-f0-9]+$/.test(encKeyB64) && encKeyB64.length === 64) {
    return Buffer.from(encKeyB64, "hex");
  }
  const buf = Buffer.from(encKeyB64, "base64");
  if (buf.length !== 32) throw new Error("TOTP_ENC_KEY must be 32 bytes");
  return buf;
};

export function sealSecret(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function openSecret(b64) {
  const key = getKey();
  const buf = Buffer.from(b64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}