// src/crypto/decrypt.ts

function b64ToBytes(b64: string): Uint8Array {
  // atob is available in browser. If SSR is added later, gate this.
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Decrypt AES-GCM ciphertext to a Blob.
 * @param data  Blob | ArrayBuffer | Uint8Array of ciphertext
 * @param keyB64 base64-encoded raw AES key
 * @param ivB64  base64-encoded IV (12 bytes recommended)
 * @param mime   optional mime for output Blob
 */
export async function decryptToBlob(
  data: Blob | ArrayBuffer | Uint8Array,
  keyB64: string,
  ivB64: string,
  mime?: string
): Promise<Blob> {
  let cipherBuf: ArrayBuffer;
  if (data instanceof Blob) {
    cipherBuf = await data.arrayBuffer();
  } else if (data instanceof ArrayBuffer) {
    cipherBuf = data;
  } else if (data instanceof Uint8Array) {
    cipherBuf = data.buffer;
  } else {
    throw new Error("Unsupported ciphertext payload for decryption");
  }

  const keyRaw = b64ToBytes(keyB64);
  const iv = b64ToBytes(ivB64);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    cipherBuf
  );

  return new Blob([plainBuf], { type: mime || "application/octet-stream" });
}