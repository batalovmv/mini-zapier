import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const AES_256_GCM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function normalizeKey(key: string): Buffer {
  return createHash('sha256').update(key, 'utf8').digest();
}

export function encrypt(plaintext: string, key: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(AES_256_GCM, normalizeKey(key), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export function decrypt(ciphertext: string, key: string): string {
  const parts = ciphertext.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format.');
  }

  const [ivPart, authTagPart, payloadPart] = parts;
  const iv = Buffer.from(ivPart, 'base64');
  const authTag = Buffer.from(authTagPart, 'base64');
  const payload = Buffer.from(payloadPart, 'base64');

  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new Error('Invalid ciphertext payload.');
  }

  const decipher = createDecipheriv(AES_256_GCM, normalizeKey(key), iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(payload),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
