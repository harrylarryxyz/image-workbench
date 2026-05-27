import { describe, expect, it, vi } from 'vitest';
import { migrateProviderSecrets } from './provider-secret-migration';
import { encryptSecret, isEncryptedSecret } from './secret-box';

describe('provider secret migration', () => {
  it('encrypts plaintext provider api keys and skips enc:v1 values', async () => {
    const encrypted = encryptSecret('already-secret', 'test-key');
    const providers = [
      { id: 'plain_1', apiKeyEncrypted: 'sk-plain-one' },
      { id: 'enc_1', apiKeyEncrypted: encrypted },
      { id: 'plain_2', apiKeyEncrypted: 'sk-plain-two' },
    ];
    const prisma = {
      providerProfile: {
        findMany: vi.fn().mockResolvedValue(providers),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const result = await migrateProviderSecrets(prisma as any, { key: 'test-key' });

    expect(result).toEqual({ scanned: 3, migrated: 2, skipped: 1, dryRun: false });
    expect(prisma.providerProfile.update).toHaveBeenCalledTimes(2);
    for (const call of prisma.providerProfile.update.mock.calls) {
      expect(isEncryptedSecret(call[0].data.apiKeyEncrypted)).toBe(true);
      expect(call[0].data.apiKeyEncrypted).not.toContain('sk-plain');
    }
  });

  it('supports dry-run without writing', async () => {
    const prisma = {
      providerProfile: {
        findMany: vi.fn().mockResolvedValue([{ id: 'plain_1', apiKeyEncrypted: 'sk-plain' }]),
        update: vi.fn(),
      },
    };

    await expect(migrateProviderSecrets(prisma as any, { key: 'test-key', dryRun: true })).resolves.toEqual({ scanned: 1, migrated: 1, skipped: 0, dryRun: true });
    expect(prisma.providerProfile.update).not.toHaveBeenCalled();
  });
});
