// backend/controllers/settingsController.js
import AppSettings from "../models/AppSettings.js";
import { sealSecret, openSecret } from "../services/crypto.js";

const OAUTH_KEYS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET"];

export async function getOAuthSettings(req, res) {
  try {
    const docs = await AppSettings.find({ key: { $in: OAUTH_KEYS } }).lean();
    const result = {};
    for (const key of OAUTH_KEYS) {
      const doc = docs.find((d) => d.key === key);
      const hasDb = !!doc?.value;
      const hasEnv = !!process.env[key];
      result[key] = { present: hasDb || hasEnv, source: hasDb ? "db" : hasEnv ? "env" : "none" };
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to get OAuth settings" });
  }
}

export async function saveOAuthSettings(req, res) {
  try {
    for (const key of OAUTH_KEYS) {
      const value = req.body[key];
      if (!value || typeof value !== "string" || value.includes("•")) continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      await AppSettings.findOneAndUpdate(
        { key },
        { $set: { value: sealSecret(trimmed) } },
        { upsert: true }
      );
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save OAuth settings" });
  }
}
