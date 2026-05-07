// Loads a credential from AppSettings DB first, falls back to process.env
import AppSettings from "../models/AppSettings.js";
import { openSecret } from "./crypto.js";

export async function loadCredential(key) {
  try {
    const doc = await AppSettings.findOne({ key }).lean();
    if (doc?.value) return openSecret(doc.value);
  } catch {
    // DB unavailable — fall through to env
  }
  return process.env[key] || "";
}
