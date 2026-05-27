import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ImageReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async assertExistingStorageKeys(keys: string[]) {
    const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))].slice(0, 4);
    if (unique.length < 1) throw new BadRequestException('at least one reference image is required');
    const rows = await this.prisma.imageAsset.findMany({ where: { storageKey: { in: unique } }, select: { storageKey: true } });
    const found = new Set(rows.map((row) => row.storageKey));
    const missing = unique.filter((key) => !found.has(key));
    if (missing.length) throw new BadRequestException(`reference image not found: ${missing.join(', ')}`);
    return unique;
  }
}
