import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from './secret-box';

const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('secret-box', () => {
  it('encrypts secrets at rest and decrypts them with the configured key', () => {
    const cipher = encryptSecret('sk-tes...-123', KEY);

    expect(cipher).toMatch(/^enc:v1:/);
    expect(cipher).not.toContain('sk-tes...-123');
    expect(isEncryptedSecret(cipher)).toBe(true);
    expect(decryptSecret(cipher, KEY)).toBe('sk-tes...-123');
  });

  it('keeps legacy plaintext readable while masking the decrypted value', () => {
    expect(isEncryptedSecret('legacy-key')).toBe(false);
    expect(decryptSecret('legacy-key')).toBe('legacy-key');
    expect(maskSecret(encryptSecret('sk-tes...-123', KEY), KEY)).toBe('sk-tes…-123');
  });
});
