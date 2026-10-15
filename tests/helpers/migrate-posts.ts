// Historical lossless converter retained only for migration regression tests.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';
import type { BlogPost } from '../../src/types/blog';
import { validatePostMetadata, validatePostSlugs } from '../../lib/content/blog-schema';

export function migratePosts(posts: readonly BlogPost[], output = 'content/posts', manifest = 'content/blog-slugs.json') {
  validatePostSlugs(posts.map(post => post.slug));
  const files = posts.map(({ content, ...metadata }) => {
    validatePostMetadata(metadata);
    if (!content.trim()) throw new Error(`Missing blog body: ${metadata.slug}`);
    let text = matter.stringify(content, metadata);
    // gray-matter adds a final newline. Remove only that added byte so the
    // parsed body remains identical to the original runtime template string.
    if (!content.endsWith('\n')) text = text.slice(0, -1);
    return { path: join(output, metadata.slug + '.mdx'), text };
  });
  files.push({ path: manifest, text: JSON.stringify(posts.map(post => post.slug), null, 2) + '\n' });
  for (const file of files) {
    if (existsSync(file.path) && readFileSync(file.path, 'utf8') !== file.text) throw new Error(`Refusing to overwrite edited file: ${file.path}`);
  }
  for (const file of files) {
    if (existsSync(file.path)) continue;
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.text, { flag: 'wx' });
  }
  return posts.map(post => ({ slug: post.slug, sha256: createHash('sha256').update(post.content).digest('hex') }));
}
