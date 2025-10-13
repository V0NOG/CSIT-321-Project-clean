// backend/services/hashChain.js
import crypto from "crypto";

export function canonical(record) {
  const obj = { ts: record.ts, actorId: record.actorId?.toString() || null, action: record.action, target: record.target || null, meta: record.meta || {} };
  return JSON.stringify(obj);
}
export function computeHash(prevHash, record) {
  const hasher = crypto.createHash("sha256");
  hasher.update(prevHash || "");
  hasher.update(canonical(record));
  return hasher.digest("hex");
}