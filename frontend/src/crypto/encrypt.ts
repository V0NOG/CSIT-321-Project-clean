// Very small AES-GCM helper to encrypt a file client-side.
// In production, you’ll also wrap fileKey with recipients’ public keys.
export async function encryptFileBlob(blob: Blob) {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const data = await blob.arrayBuffer();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  // Export the symmetric key (JWK). In a sharing flow, you'd wrap this for recipients.
  const jwk = await crypto.subtle.exportKey("jwk", key);

  return {
    ciphertext: new Blob([ct]),
    fileKeyJwk: jwk,
    iv: Array.from(iv), // store alongside metadata if needed
  };
}

export async function decryptFileBytes(
  cipher: ArrayBuffer,
  keyB64: string,
  ivB64: string
): Promise<Blob> {
  const keyRaw = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new Blob([plain]);
}