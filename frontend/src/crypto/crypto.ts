// src/crypto/crypto.ts
export async function genKeyIv() {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 256-bit AES
  const iv = crypto.getRandomValues(new Uint8Array(12));  // 96-bit IV for GCM
  return { key, iv };
}

export function b64encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
export function b64decode(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptFileBlob(file: File) {
  const { key, iv } = await genKeyIv();
  const alg = { name: "AES-GCM", iv };
  const cryptoKey = await crypto.subtle.importKey("raw", key, alg, false, ["encrypt"]);
  const buf = await file.arrayBuffer();
  const ct = await crypto.subtle.encrypt(alg, cryptoKey, buf);
  return {
    ciphertext: new Uint8Array(ct),
    keyB64: b64encode(key),
    ivB64: b64encode(iv),
    size: buf.byteLength,
    mime: file.type || "application/octet-stream",
  };
}

export async function decryptToBlob(ciphertext: ArrayBuffer, keyB64: string, ivB64: string, mime: string) {
  const key = b64decode(keyB64);
  const iv = b64decode(ivB64);
  const alg = { name: "AES-GCM", iv };
  const cryptoKey = await crypto.subtle.importKey("raw", key, alg, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt(alg, cryptoKey, ciphertext);
  return new Blob([pt], { type: mime || "application/octet-stream" });
}