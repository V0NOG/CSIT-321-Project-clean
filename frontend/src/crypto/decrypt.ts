// src/crypto/decrypt.ts
// Decrypt AES-GCM content stored as: IV(12) || ciphertext+authTag
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