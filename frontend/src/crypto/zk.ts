// src/crypto/zk.ts
// Device-level ZK: a single-device master key stored locally (never uploaded)

const MASTER_KEY_NAME = "DEVICE_MASTER_KEY_V1";

// Generate or fetch a persistent AES-GCM 256-bit CryptoKey (kept only locally)
export async function getDeviceMasterKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(MASTER_KEY_NAME);
  if (existing) {
    const raw = base64ToArrayBuffer(existing);
    return await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt","decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(MASTER_KEY_NAME, arrayBufferToBase64(raw));
  return key;
}

// Wrap {keyB64, ivB64} into a compact JSON and encrypt it with device master key
export async function wrapFileKey(keyB64: string, ivB64: string): Promise<string> {
  const master = await getDeviceMasterKey();
  const payload = new TextEncoder().encode(JSON.stringify({ keyB64, ivB64 }));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, master, payload);
  // store iv || ciphertext in base64
  const combined = new Uint8Array(iv.byteLength + (ct as ArrayBuffer).byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct as ArrayBuffer), iv.byteLength);
  return arrayBufferToBase64(combined.buffer);
}

// Unwrap: returns {keyB64, ivB64}
export async function unwrapFileKey(wrappedKeyB64: string): Promise<{ keyB64: string; ivB64: string }> {
  const master = await getDeviceMasterKey();
  const buf = base64ToArrayBuffer(wrappedKeyB64);
  const u8 = new Uint8Array(buf);
  const iv = u8.slice(0, 12);
  const ct = u8.slice(12);

  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, master, ct);
  const obj = JSON.parse(new TextDecoder().decode(plain));
  return { keyB64: obj.keyB64, ivB64: obj.ivB64 };
}

// helpers
function arrayBufferToBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
