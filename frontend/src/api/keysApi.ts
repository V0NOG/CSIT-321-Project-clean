// frontend/src/api/keysApi.ts
import axios from "axios";

const BASE = "/api/keys";

function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Get the current user's own public key + encrypted private key. */
export async function getMyKeys(): Promise<{ pubKey: string | null; encPrivKey: string | null }> {
  const res = await axios.get(`${BASE}/me`, { headers: authHeader(), withCredentials: true });
  return res.data;
}

/** Get another user's public key by their user ID. */
export async function getUserPublicKey(userId: string): Promise<string | null> {
  try {
    const res = await axios.get(`${BASE}/public/${userId}`, { headers: authHeader(), withCredentials: true });
    return res.data.pubKey || null;
  } catch {
    return null;
  }
}

/** Upload (or rotate) this user's RSA keypair to the backend. */
export async function rotateKeys(pubKey: string, encPrivKey: string): Promise<void> {
  await axios.post(
    `${BASE}/rotate`,
    { pubKey, encPrivKey },
    { headers: { ...authHeader(), "Content-Type": "application/json" }, withCredentials: true }
  );
}
