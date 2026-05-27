import { PrismaClient } from '@prisma/client';
import { encryptSecret, isEncryptedSecret } from './secret-box';

type ProviderSecretRow = { id: string; apiKeyEncrypted: string };
type ProviderSecretPrisma = {
  providerProfile: {
    findMany: (args?: unknown) => Promise<ProviderSecretRow[]>;
    update: (args: { where: { id: string }; data: { apiKeyEncrypted: string } }) => Promise<unknown>;
  };
};

export type ProviderSecretMigrationResult = {
  scanned: number;
  migrated: number;
  skipped: number;
  dryRun: boolean;
};

export async function migrateProviderSecrets(
  prisma: ProviderSecretPrisma,
  options: { key?: string; dryRun?: boolean } = {},
): Promise<ProviderSecretMigrationResult> {
  const rows = await prisma.providerProfile.findMany({ select: { id: true, apiKeyEncrypted: true }, orderBy: { updatedAt: 'asc' } });
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.apiKeyEncrypted || isEncryptedSecret(row.apiKeyEncrypted)) {
      skipped += 1;
      continue;
    }
    migrated += 1;
    if (!options.dryRun) {
      await prisma.providerProfile.update({
        where: { id: row.id },
        data: { apiKeyEncrypted: encryptSecret(row.apiKeyEncrypted, options.key) },
      });
    }
  }

  return { scanned: rows.length, migrated, skipped, dryRun: Boolean(options.dryRun) };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();
  try {
    const result = await migrateProviderSecrets(prisma as unknown as ProviderSecretPrisma, { dryRun });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
