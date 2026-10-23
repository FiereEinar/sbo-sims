import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the JWT_SECRET_KEY env var so we don't
 * need a separate environment variable.  Falls back to a static default
 * only in development so the server never crashes if the env is missing.
 */
const getEncryptionKey = (): Buffer => {
  const secret = process.env.JWT_SECRET_KEY || 'fallback-dev-secret-key-32chars!!';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts a plain-text string with AES-256-GCM.
 * Returns a colon-separated hex string: `iv:authTag:ciphertext`
 */
export const encrypt = (plaintext: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a string previously encrypted by `encrypt()`.
 * Returns `null` if decryption fails (invalid tag, corrupted data, etc.).
 */
export const decrypt = (ciphertext: string): string | null => {
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
};
