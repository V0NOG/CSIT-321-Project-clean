// backend/controllers/connectorsController.js
import jwt from "jsonwebtoken";
import StorageConnector from "../models/StorageConnector.js";
import { sealSecret, openSecret } from "../services/crypto.js";
import { loadCredential } from "../services/credentialLoader.js";
import {
  getAuthUrl as getGoogleAuthUrl,
  exchangeCode as exchangeGoogleCode,
  getUserInfo as getGoogleUserInfo,
} from "../services/googledrive.js";
import {
  getAuthUrl as getDropboxAuthUrl,
  exchangeCode as exchangeDropboxCode,
  getUserInfo as getDropboxUserInfo,
} from "../services/userdropbox.js";

const STATE_SECRET = process.env.JWT_ACCESS_SECRET || "fallback-secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function signState(userId) {
  return jwt.sign({ userId }, STATE_SECRET, { expiresIn: "10m" });
}

function verifyState(token) {
  try {
    const payload = jwt.verify(token, STATE_SECRET);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function listConnectors(req, res) {
  try {
    const items = await StorageConnector.find({ owner: req.user.id, isActive: true })
      .select("-encTokens")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch {
    res.status(500).json({ error: "Failed to list connectors" });
  }
}

export async function deleteConnector(req, res) {
  try {
    const doc = await StorageConnector.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!doc) return res.status(404).json({ error: "Connector not found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete connector" });
  }
}

// GET /api/connectors/google/auth — returns { authUrl }
export async function startGoogleAuth(req, res) {
  try {
    const stateToken = signState(req.user.id);
    const authUrl = await getGoogleAuthUrl(stateToken);
    res.json({ authUrl });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to build Google auth URL" });
  }
}

// GET /api/connectors/google/callback  (browser redirect from Google)
export async function handleGoogleCallback(req, res) {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${FRONTEND_URL}/connectors?error=${encodeURIComponent(error)}`);

    const userId = verifyState(state);
    if (!userId) return res.redirect(`${FRONTEND_URL}/connectors?error=invalid_state`);

    const tokens = await exchangeGoogleCode(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token).catch(() => null);

    const encTokens = sealSecret(JSON.stringify(tokens));

    await StorageConnector.findOneAndUpdate(
      { owner: userId, provider: "google_drive" },
      {
        $set: {
          owner: userId,
          provider: "google_drive",
          name: `Google Drive${userInfo?.email ? ` (${userInfo.email})` : ""}`,
          encTokens,
          providerEmail: userInfo?.email,
          providerName: userInfo?.name,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/connectors?success=google`);
  } catch (e) {
    console.error("[google callback]", e);
    const msg =
      e?.response?.data?.error_description ||
      e?.response?.data?.error ||
      e?.message ||
      "google_auth_failed";
    res.redirect(`${FRONTEND_URL}/connectors?error=${encodeURIComponent(msg)}`);
  }
}

// GET /api/connectors/dropbox/auth — returns { authUrl }
export async function startDropboxAuth(req, res) {
  try {
    const stateToken = signState(req.user.id);
    const authUrl = await getDropboxAuthUrl(stateToken);
    res.json({ authUrl });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to build Dropbox auth URL" });
  }
}

// GET /api/connectors/dropbox/callback
export async function handleDropboxCallback(req, res) {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${FRONTEND_URL}/connectors?error=${encodeURIComponent(error)}`);

    const userId = verifyState(state);
    if (!userId) return res.redirect(`${FRONTEND_URL}/connectors?error=invalid_state`);

    const tokens = await exchangeDropboxCode(code);
    const userInfo = await getDropboxUserInfo(tokens.access_token).catch(() => null);

    const encTokens = sealSecret(JSON.stringify(tokens));
    const email = userInfo?.email || "";

    await StorageConnector.findOneAndUpdate(
      { owner: userId, provider: "dropbox" },
      {
        $set: {
          owner: userId,
          provider: "dropbox",
          name: `Dropbox${email ? ` (${email})` : ""}`,
          encTokens,
          providerEmail: email,
          providerName: userInfo?.name?.display_name,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/connectors?success=dropbox`);
  } catch (e) {
    console.error("[dropbox callback]", e);
    const msg = e?.message || "dropbox_auth_failed";
    res.redirect(`${FRONTEND_URL}/connectors?error=${encodeURIComponent(msg)}`);
  }
}

// GET /api/connectors/config — returns redirect URIs and credential status
export async function getConnectorConfig(req, res) {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5050";
    const [googleClientId, googleClientSecret, dropboxAppKey, dropboxAppSecret] = await Promise.all([
      loadCredential("GOOGLE_CLIENT_ID"),
      loadCredential("GOOGLE_CLIENT_SECRET"),
      loadCredential("DROPBOX_APP_KEY"),
      loadCredential("DROPBOX_APP_SECRET"),
    ]);
    res.json({
      googleRedirectUri: `${backendUrl}/api/connectors/google/callback`,
      dropboxRedirectUri: `${backendUrl}/api/connectors/dropbox/callback`,
      googleClientIdPresent: !!googleClientId,
      googleClientSecretPresent: !!googleClientSecret,
      dropboxAppKeyPresent: !!dropboxAppKey,
      dropboxAppSecretPresent: !!dropboxAppSecret,
    });
  } catch {
    res.status(500).json({ error: "Failed to get config" });
  }
}

// Helper used by filesController: load and decrypt connector tokens
export async function getConnectorTokens(connectorId) {
  const doc = await StorageConnector.findById(connectorId).lean();
  if (!doc) throw new Error("Connector not found");
  return { provider: doc.provider, tokens: JSON.parse(openSecret(doc.encTokens)) };
}

// Helper: update stored tokens after a refresh
export async function updateConnectorTokens(connectorId, updatedTokens) {
  await StorageConnector.updateOne(
    { _id: connectorId },
    { $set: { encTokens: sealSecret(JSON.stringify(updatedTokens)) } }
  );
}
