// src/crypto/encrypt.ts
// Encrypt a Blob with AES-GCM using the provided raw 32-byte fileKey.
// Output format: IV(12) || ciphertext+authTag
export async function encryptFileBlob(blob: Blob, fileKey?: Uint8Array) {
  const key = fileKey && fileKey.length
    ? await crypto.subtle.importKey("raw", fileKey, { name: "AES-GCM" }, false, ["encrypt"])
    : await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await blob.arrayBuffer();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  const ctU8 = new Uint8Array(ct);
  const out = new Uint8Array(iv.length + ctU8.length);
  out.set(iv, 0);
  out.set(ctU8, iv.length);

  return { ciphertext: new Blob([out]) };
}