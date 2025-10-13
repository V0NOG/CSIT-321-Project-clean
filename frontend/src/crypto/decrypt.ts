// src/crypto/decrypt.ts
//
// Minimal decrypt helpers to match our upload/download flow.
//
// Assumptions (aligns with the encrypt side we used earlier):
// - The file was encrypted with AES-GCM (256-bit key).
// - The ciphertext blob is prefixed with a 12-byte IV: [ IV(12) | GCM-ciphertext+tag ].
// - The "wrapped" key stored in Mongo is just a base64 of the raw 32-byte file key
//   (i.e., not additionally wrapped with a passphrase). If you later add true wrapping,
//   update unwrapFileKey() accordingly.

function base64ToBytes(b64: string): Uint8Array {
  // atob/btoa are available in browser; if you ever run this in Node, swap to Buffer.
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function unwrapFileKey(wrappedKeyB64: string): Promise<CryptoKey> {
  // CURRENTLY: wrappedKeyB64 is just base64 of the raw 32-byte AES key.
  // If you implement real wrapping with a user secret, do unwrap here and keep
  // the function signature the same so the rest of the app doesn't change.
  const raw = base64ToBytes(wrappedKeyB64);
  if (raw.byteLength !== 32) {
    // still import, but warn; AES-GCM keys should be 16/24/32 bytes. We expect 32.
    console.warn("[unwrapFileKey] unexpected key length:", raw.byteLength);
  }
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,            // not extractable
    ["decrypt"]       // only need decrypt for downloads
  );
}

export async function decryptAesGcm(
  key: CryptoKey,
  cipherAb: ArrayBuffer,   // [IV(12) | ciphertext+tag]
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(cipherAb);
  if (bytes.byteLength < 13) {
    throw new Error("Ciphertext too short");
  }
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return plain; // ArrayBuffer
}

// src/crypto/decrypt.ts
// Decrypt AES-GCM content that was stored as: iv(12) || ciphertext+tag
// Returns a Blob of the original file.

export async function decryptAesGcmToBlob(
  cipherBlob: Blob,
  keyBytes: Uint8Array,
  mime: string
): Promise<Blob> {
  const all = new Uint8Array(await cipherBlob.arrayBuffer());
  if (all.length < 12 + 16) throw new Error("ciphertext too short");
  const iv = all.slice(0, 12);
  const data = all.slice(12);
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  );
  return new Blob([plain], { type: mime || "application/octet-stream" });
}
