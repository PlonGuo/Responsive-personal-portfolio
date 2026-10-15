import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Include source literals as well as content so JSX labels cannot be missed.
const roots = ['app', 'src/components', 'content', 'lib/i18n/messages'];
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(tsx?|json|mdx)$/.test(file) ? [file] : [];
  });
}
export function collectFontCharacters(projectRoot = process.cwd()): string {
  const text = roots.flatMap(directory => sourceFiles(resolve(projectRoot, directory)))
    .map(file => readFileSync(file, 'utf8')).join('\n');
  const ascii = Array.from({ length: 95 }, (_, index) => String.fromCodePoint(index + 32)).join('');
  return [...new Set(ascii + text)].filter(char => !/\p{Cc}/u.test(char))
    .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join('');
}
export function checkFontCoverage(projectRoot = process.cwd()): void {
  const directory = resolve(projectRoot, 'public/fonts');
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8')) as {
    fonts: Array<{ file: string; sha256: string; codepoints: number[] }>;
  };
  if (manifest.fonts.length !== 2) throw new Error('Expected regular and bold font subsets');
  const required = [...collectFontCharacters(projectRoot)]
    .filter(char => /[\p{Script=Han}\p{Script=Latin}\p{Number}\p{Punctuation}]/u.test(char));
  for (const font of manifest.fonts) {
    const data = readFileSync(join(directory, font.file));
    if (createHash('sha256').update(data).digest('hex') !== font.sha256) throw new Error(`Font hash mismatch: ${font.file}`);
    const supported = new Set(font.codepoints);
    const missing = required.filter(char => !supported.has(char.codePointAt(0)!));
    if (missing.length) throw new Error(`Font subset ${font.file} misses ${missing.join('')}; run fonts:characters and regenerate the subsets`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) { checkFontCoverage(); console.log('Static font glyph coverage and file hashes are complete.'); }
  else {
    const destination = process.argv[2];
    if (!destination) throw new Error('Usage: pnpm fonts:characters <output-file>');
    const characters = collectFontCharacters();
    writeFileSync(destination, characters);
    console.log(`${[...characters].length} unique characters written to ${destination}`);
  }
}
