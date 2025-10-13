// src/crypto/keys.ts
// Helpers for KEK (user key), wrapping/unwrapping per-file keys with AES-GCM.

function u8(n: number) {
  return new Uint8Array(n);
}

export function b64encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
export function b64decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = u8(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importAesGcmKey(raw: Uint8Array) {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function getOrCreateUserKEK(): Uint8Array {
  let b64 = localStorage.getItem("userKeyB64");
  if (!b64) {
    const raw = crypto.getRandomValues(u8(32)); // 256-bit KEK
    b64 = b64encode(raw);
    localStorage.setItem("userKeyB64", b64);
  }
  return b64decode(b64);
}

// ---- File-key generation/wrapping ----

export function genFileKey(): Uint8Array {
  // 256-bit per-file key
  return crypto.getRandomValues(u8(32));
}

/**
 * Wrap a per-file key with the user's KEK using AES-GCM.
 * Returns base64(iv(12) || ciphertext+tag)
 */
export async function wrapFileKey(fileKey: Uint8Array, userKEK?: Uint8Array): Promise<string> {
  const kek = await importAesGcmKey(userKEK || getOrCreateUserKEK());
  const iv = crypto.getRandomValues(u8(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, fileKey)
  ); // includes tag at the end
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return b64encode(out);
}

/**
 * Unwrap a wrapped file key (base64(iv||ciphertext+tag)) back to raw 32 bytes.
 */
export async function unwrapFileKey(wrappedKeyB64: string, userKEK?: Uint8Array): Promise<Uint8Array> {
  const kek = await importAesGcmKey(userKEK || getOrCreateUserKEK());
  const all = b64decode(wrappedKeyB64);
  if (all.length < 12 + 16) throw new Error("wrapped key blob too short");
  const iv = all.slice(0, 12);
  const data = all.slice(12);
  const raw = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv }, kek, data)
  );
  if (raw.length !== 16 && raw.length !== 32) {
    // We expect 32 (AES-256). 16 (AES-128) is acceptable, but warn.
    console.warn("[unwrapFileKey] unexpected key length:", raw.length);
  }
  return raw;
}