// backend/services/audit.js
import AuditLog from "../models/AuditLog.js";
import { computeHash } from "./hashChain.js";

export async function appendAudit({ actorId, action, target, meta }) {
  const last = await AuditLog.findOne({}, {}, { sort: { ts: -1, _id: -1 } }).lean();
  const record = { ts: new Date(), actorId, action, target, meta };
  const prevHash = last?.hash || null;
  const hash = computeHash(prevHash, record);
  const doc = await AuditLog.create({ ...record, prevHash, hash });
  return doc;
}