import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export class LocalStorageAdapter {
  constructor(private readonly root: string) {}

  async put(objectKey: string, bytes: Uint8Array) {
    await mkdir(join(this.root, ...objectKey.split('/').slice(0, -1)), { recursive: true });
    await writeFile(join(this.root, objectKey), bytes);
  }

  async resolveExistingPath(storageKey: string, key: string): Promise<string | null> {
    const safe = key.split('/').filter((part) => part && part !== '..').join('/');
    const root = resolve(this.root);
    const file = resolve(root, safe);
    if (!file.startsWith(root)) return null;
    try {
      await access(file);
      return file;
    } catch {
      return null;
    }
  }

  async read(file: string) {
    return readFile(file);
  }

  async delete(file: string) {
    await rm(file, { force: true });
    return true;
  }
}
