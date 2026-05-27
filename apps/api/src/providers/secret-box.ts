import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';

function keyBytes(key = process.env.PROVIDER_SECRET_KEY ?? process.env.SECRET_ENCRYPTION_KEY ?? ''): Buffer {
  const value = key.trim();
  if (/^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, 'hex');
  return createHash('sha256').update(value || 'image-workbench-development-secret').digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(value: string, key?: string): string {
  if (!value) return value;
  if (isEncryptedSecret(value)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(key), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString('base64url')}`;
}

export function decryptSecret(value: string, key?: string): string {
  if (!value || !isEncryptedSecret(value)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), 'base64url');
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function maskSecret(value: string, key?: string): string {
  const plain = decryptSecret(value, key);
  if (!plain) return '';
  if (plain.length <= 10) return `${plain.slice(0, 2)}…${plain.slice(-2)}`;
  return `${plain.slice(0, 6)}…${plain.slice(-4)}`;
}
