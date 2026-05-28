import sharp from 'sharp';

export async function normalizeMaskForReference(maskBytes: Uint8Array, referenceBytes: Uint8Array, maskMode: 'painted-area' | 'provider-transparent-edit'): Promise<Buffer> {
  const [maskMeta, referenceMeta] = await Promise.all([
    sharp(Buffer.from(maskBytes), { failOn: 'none' }).metadata(),
    sharp(Buffer.from(referenceBytes), { failOn: 'none' }).metadata(),
  ]);
  const width = referenceMeta.width;
  const height = referenceMeta.height;
  if (!width || !height) return Buffer.from(maskBytes);
  const normalized = maskMeta.width === width && maskMeta.height === height && maskMeta.format === 'png'
    ? Buffer.from(maskBytes)
    : await sharp(Buffer.from(maskBytes), { failOn: 'none' })
    .rotate()
    .ensureAlpha()
    .resize({ width, height, fit: 'fill' })
    .png()
    .toBuffer();
  if (maskMode === 'provider-transparent-edit') return normalized;
  return convertPaintedSelectionToProviderMask(normalized, width, height);
}

export async function convertPaintedSelectionToProviderMask(maskBytes: Uint8Array, width: number, height: number): Promise<Buffer> {
  const { data } = await sharp(Buffer.from(maskBytes), { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 255 - data[index + 3];
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}
