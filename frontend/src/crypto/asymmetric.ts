// frontend/src/crypto/asymmetric.ts
// RSA-OAEP 2048-bit keypair utilities for zero-knowledge file key sharing.
// The file key (32-byte AES-256) is encrypted with the recipient's RSA public key.
// Only the recipient, using their private key, can unwrap it.

import { b64encode, b64decode, wrapFileKey, unwrapFileKey } from "./keys";

const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

/** Generate a new RSA-OAEP keypair. */
export async function generateRsaKeypair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(RSA_PARAMS, true, ["encrypt", "decrypt"]);
}

/** Export the public key as base64(SPKI). */
export async function exportPublicKeyB64(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", key);
  return b64encode(new Uint8Array(spki));
}

/** Import a base64(SPKI) public key for encryption. */
export async function importPublicKeyB64(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("spki", b64decode(b64), RSA_PARAMS, false, ["encrypt"]);
}

/** Import raw PKCS8 bytes as an RSA private key. */
async function importPrivateKeyBytes(pkcs8Bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("pkcs8", pkcs8Bytes, RSA_PARAMS, false, ["decrypt"]);
}

/**
 * Wrap a file key with the recipient's RSA-OAEP public key.
 * Returns base64(RSA-encrypted file key).
 */
export async function wrapFileKeyForRecipient(fileKeyBytes: Uint8Array, recipientPubKeyB64: string): Promise<string> {
  const pubKey = await importPublicKeyB64(recipientPubKeyB64);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, fileKeyBytes);
  return b64encode(new Uint8Array(encrypted));
}

/**
 * Load and decrypt this user's RSA private key.
 * The private key is stored as PKCS8 bytes, AES-GCM wrapped with the user's KEK.
 */
export async function loadPrivateKey(encPrivKeyB64: string): Promise<CryptoKey> {
  const pkcs8Bytes = await unwrapFileKey(encPrivKeyB64);
  return importPrivateKeyBytes(pkcs8Bytes);
}

/**
 * Unwrap a file key that was RSA-OAEP encrypted for this user.
 * encPrivKeyB64: the user's AES-GCM-wrapped RSA private key (from backend).
 */
export async function unwrapSharedFileKey(wrappedB64: string, encPrivKeyB64: string): Promise<Uint8Array> {
  const privKey = await loadPrivateKey(encPrivKeyB64);
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privKey, b64decode(wrappedB64));
  return new Uint8Array(decrypted);
}

/**
 * Initialize an RSA keypair for the user if they don't have one yet.
 * - Checks backend for existing pubKey; skips if already set.
 * - Generates new keypair, wraps private key with user's KEK, uploads to backend.
 */
export async function initUserKeypair(
  getMyKeys: () => Promise<{ pubKey: string | null; encPrivKey: string | null }>,
  rotateKeys: (pubKey: string, encPrivKey: string) => Promise<void>
): Promise<void> {
  const { pubKey } = await getMyKeys();
  if (pubKey) return; // Already initialized

  const keypair = await generateRsaKeypair();
  const pubKeyB64 = await exportPublicKeyB64(keypair.publicKey);

  // Export private key as PKCS8 bytes, then wrap with the user's KEK (AES-GCM)
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keypair.privateKey);
  const pkcs8Bytes = new Uint8Array(pkcs8);
  const encPrivKeyB64 = await wrapFileKey(pkcs8Bytes);

  await rotateKeys(pubKeyB64, encPrivKeyB64);
}
