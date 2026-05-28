#!/usr/bin/env ts-node
import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const root = process.env.STORAGE_DIR || './data/uploads';

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

async function main() {
  const assets = await prisma.imageAsset.findMany({ select: { storageKey: true, thumbnailKey: true } });
  const known = new Set(assets.flatMap((a) => [a.storageKey, a.thumbnailKey]).filter(Boolean).map((key) => String(key).replace('local://', '')));
  const files = await walk(root);
  const orphans = [] as Array<{ file: string; bytes: number }>;
  for (const file of files) {
    const rel = file.slice(root.length + 1);
    if (known.has(rel)) continue;
    const info = await stat(file);
    orphans.push({ file, bytes: info.size });
    if (!dryRun) await rm(file, { force: true });
  }
  console.log(JSON.stringify({ dryRun, count: orphans.length, bytes: orphans.reduce((s, x) => s + x.bytes, 0), orphans: orphans.slice(0, 200) }, null, 2));
}
main().finally(() => prisma.$disconnect());
