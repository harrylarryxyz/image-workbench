import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else yield path;
  }
}

test('production browser chunks do not point API calls at localhost', () => {
  const staticDir = join(process.cwd(), '.next', 'static');
  assert.equal(existsSync(staticDir), true, 'run `pnpm --filter @image-workbench/web build` before this guard');
  const offenders = [];
  for (const file of walk(staticDir)) {
    if (!file.endsWith('.js')) continue;
    const text = readFileSync(file, 'utf8');
    if (text.includes('http://localhost:3100')) offenders.push(file);
  }
  assert.deepEqual(offenders, [], `browser bundle must use /api, not localhost: ${offenders.join(', ')}`);
});
