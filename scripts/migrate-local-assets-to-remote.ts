#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { LocalStorageService } from '../apps/api/src/storage/local-storage.service';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 200;

async function main() {
  const remote = new LocalStorageService({ backend: (process.env.TARGET_STORAGE_BACKEND as any) || (process.env.STORAGE_BACKEND as any) || 's3' });
  const local = new LocalStorageService({ backend: 'local' as any, root: process.env.STORAGE_DIR });
  const rows = await prisma.imageAsset.findMany({ where: { storageKey: { startsWith: 'local://' } }, take: limit, orderBy: { createdAt: 'asc' } });
  const migrated: Array<{ id: string; from: string; to?: string; dryRun: boolean }> = [];
  for (const row of rows) {
    if (dryRun) { migrated.push({ id: row.id, from: row.storageKey, dryRun: true }); continue; }
    const bytes = await local.readImage(row.storageKey);
    const stored = await remote.putImage(bytes);
    await prisma.imageAsset.update({ where: { id: row.id }, data: { storageKey: stored.storageKey, thumbnailKey: stored.thumbnailKey, metadataJson: { ...(row.metadataJson as any ?? {}), migratedFrom: row.storageKey } } });
    migrated.push({ id: row.id, from: row.storageKey, to: stored.storageKey, dryRun: false });
  }
  console.log(JSON.stringify({ dryRun, count: migrated.length, migrated }, null, 2));
}
main().finally(() => prisma.$disconnect());
