import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import type { RequestContext } from '../auth/request-context';

function objectPath(storageKey: string): string {
  const value = String(storageKey ?? '').trim();
  if (value.startsWith('local://')) return value.slice('local://'.length);
  const remote = value.match(/^(?:s3|r2|minio):\/\/[^/]+\/(.+)$/);
  return remote?.[1] ?? value;
}

function isWorkspaceUpload(storageKey: string, workspaceId?: string | null): boolean {
  if (!workspaceId) return false;
  const path = objectPath(storageKey);
  return path.startsWith(`uploads/${workspaceId}/`) || path.startsWith(`thumbs/uploads/${workspaceId}/`);
}

@Injectable()
export class ImageReferenceService {
  constructor(private readonly prisma: PrismaService, @Optional() private readonly storage?: LocalStorageService) {}

  async assertExistingStorageKeys(keys: string[], ctx?: RequestContext) {
    const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))].slice(0, 4);
    if (unique.length < 1) throw new BadRequestException('at least one reference image is required');
    const rows = await this.prisma.imageAsset.findMany({ where: { storageKey: { in: unique }, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, select: { storageKey: true } });
    const found = new Set(rows.map((row) => row.storageKey));
    for (const key of unique) {
      if (found.has(key)) continue;
      if (!(ctx?.workspaceId && isWorkspaceUpload(key, ctx.workspaceId))) continue;
      if (!this.storage) continue;
      const localPath = await this.storage.resolveExistingPath(key).catch(() => null);
      if (localPath) {
        found.add(key);
        continue;
      }
      if (/^(?:s3|r2|minio):\/\//.test(key)) {
        try {
          await this.storage.readImage(key);
          found.add(key);
        } catch {
          // keep missing; remote object could not be verified
        }
      }
    }
    const missing = unique.filter((key) => !found.has(key));
    if (missing.length) throw new BadRequestException(`reference image not found: ${missing.join(', ')}`);
    return unique;
  }
}
