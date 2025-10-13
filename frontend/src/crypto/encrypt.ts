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