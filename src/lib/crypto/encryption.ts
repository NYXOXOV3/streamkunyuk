/**
 * AES-256-GCM Encryption / Decryption
 *
 * Used to encrypt API credentials before storing them in the
 * `api_credentials` table. The encryption key comes from the
 * CREDENTIAL_ENCRYPTION_KEY environment variable.
 *
 * Returns { iv, encrypted } objects — the IV is stored alongside
 * the ciphertext so it can be used for decryption later.
 *
 * SECURITY NOTES:
 *   - Uses AES-256-GCM (authenticated encryption — tamper-evident)
 *   - Each encryption call generates a unique random 12-byte IV
 *   - The IV is NOT secret — it's stored alongside the ciphertext
 *   - The encryption key MUST be 32 bytes (256 bits) and stored securely
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

async function getKey(encryptionKey: string): Promise<CryptoKey> {
  // Ensure the key is exactly 32 bytes
  const keyBytes = new TextEncoder().encode(
    encryptionKey.padEnd(32, "0").slice(0, 32),
  );

  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export interface EncryptedPayload {
  /** Base64-encoded IV (12 bytes) */
  iv: string;
  /** Base64-encoded ciphertext + auth tag (GCM appends it automatically) */
  encrypted: string;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export async function encrypt(
  plaintext: string,
  encryptionKey: string,
): Promise<EncryptedPayload> {
  const key = await getKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    encoded,
  );

  return {
    iv: Buffer.from(iv).toString("base64"),
    encrypted: Buffer.from(ciphertext).toString("base64"),
  };
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 */
export async function decrypt(
  encryptedBase64: string,
  ivBase64: string,
  encryptionKey: string,
): Promise<string> {
  const key = await getKey(encryptionKey);
  const iv = Buffer.from(ivBase64, "base64");
  const ciphertext = Buffer.from(encryptedBase64, "base64");

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}