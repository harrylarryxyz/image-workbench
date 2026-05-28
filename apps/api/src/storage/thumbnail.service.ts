import sharp from 'sharp';

export async function createThumbnail(bytes: Uint8Array): Promise<Buffer | null> {
  try {
    return await sharp(Buffer.from(bytes), { failOn: 'none' })
      .rotate()
      .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    return null;
  }
}
