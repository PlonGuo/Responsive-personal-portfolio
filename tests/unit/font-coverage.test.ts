import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test } from 'vitest';
import { checkFontCoverage, collectFontCharacters } from '../../scripts/font-characters';

const temporary: string[] = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true }); });
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-font-'));
  temporary.push(directory);
  for (const name of ['app', 'src/components', 'content', 'lib/i18n/messages', 'public']) mkdirSync(join(directory, name), { recursive: true });
  cpSync('public/fonts', join(directory, 'public/fonts'), { recursive: true });
  return directory;
}
test('both actual font subsets cover all static Chinese, Latin, numbers and punctuation', () => {
  expect(() => checkFontCoverage()).not.toThrow();
  expect(collectFontCharacters()).toContain('过');
  expect(collectFontCharacters()).toContain('融');
});
test('new content outside the subset fails instead of silently falling back', () => {
  const directory = fixture();
  writeFileSync(join(directory, 'content', 'new.ts'), "export const title = '龘';");
  expect(() => checkFontCoverage(directory)).toThrow(/misses 龘/);
});
test('a modified binary cannot reuse an old coverage manifest', () => {
  const directory = fixture();
  const path = join(directory, 'public/fonts/noto-sans-sc-400.woff2');
  writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from([1])]));
  expect(() => checkFontCoverage(directory)).toThrow(/Font hash mismatch/);
});
