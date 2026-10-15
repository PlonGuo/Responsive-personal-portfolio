import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import baseline from '../fixtures/blog-baseline.json';
const blogPosts = baseline.posts.map(({ contentSha256, ...metadata }) => {
  void contentSha256;
  return { ...metadata, content: matter(readFileSync(join('content/posts', metadata.slug + '.mdx'), 'utf8')).content };
});
import { getPosts, getPost, getLatestPosts, getAllTags } from '../../lib/content/posts';

vi.mock('server-only', () => ({}));
const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

test.each(baseline.posts)('preserves all metadata and the exact runtime Markdown for $slug', original => {
  const { contentSha256, ...metadata } = original;
  const migrated = matter(readFileSync(join('content/posts', original.slug + '.mdx'), 'utf8'));
  expect(migrated.data).toEqual(metadata);
  expect(createHash('sha256').update(migrated.content).digest('hex')).toBe(contentSha256);
});

test('the manifest contains exactly the nine original slugs without duplicates', () => {
  const slugs = JSON.parse(readFileSync('content/blog-slugs.json', 'utf8'));
  expect(slugs).toEqual(blogPosts.map(post => post.slug));
  expect(new Set(slugs).size).toBe(9);
});

test('file getters preserve date order, content, tag filtering inputs and independent returned values', () => {
  const expected = [...blogPosts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  expect(getPosts()).toEqual(expected);
  expect(getLatestPosts(2).map(post => post.slug)).toEqual(['claude-dev-setup-ralph-loop', 'smia-mcp-server']);
  expect(getAllTags()).toEqual([...new Set(blogPosts.flatMap(post => post.tags))].sort());
  const post = getPost('why-i-chose-cs')!;
  post.tags.push('local mutation');
  expect(getPost('why-i-chose-cs')?.tags).not.toContain('local mutation');
});

test.each(['no-such-post', '../portfolio/en', '/etc/passwd', 'why-i-chose-cs.mdx', '%2e%2e%2fsecret', '__proto__'])('does not read an arbitrary slug: %s', slug => {
  expect(getPost(slug)).toBeUndefined();
});

test('migration is lossless for backticks, slash escapes and ASCII diagrams and refuses edited destinations', async () => {
  const { migratePosts } = await import('../helpers/migrate-posts');
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-blog-')); directories.push(directory);
  const output = join(directory, 'posts'); const manifest = join(directory, 'slugs.json');
  const original = { ...blogPosts[8], content: 'Literal `code` and \\path\n\n```text\n+---+\n| A | --> B\n+---+\n```' };
  migratePosts([original], output, manifest);
  const path = join(output, original.slug + '.mdx');
  expect(matter(readFileSync(path, 'utf8')).content).toBe(original.content);
  expect(() => migratePosts([original], output, manifest)).not.toThrow();
  writeFileSync(path, 'User edited article');
  expect(() => migratePosts([original], output, manifest)).toThrow(/overwrite|edited/i);
  expect(readFileSync(path, 'utf8')).toBe('User edited article');
});

test('migration rejects duplicates, invalid dates and missing titles before writing', async () => {
  const { migratePosts } = await import('../helpers/migrate-posts');
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-blog-')); directories.push(directory);
  const run = (posts: typeof blogPosts) => migratePosts(posts, join(directory, 'posts'), join(directory, 'slugs.json'));
  expect(() => run([blogPosts[0], blogPosts[0]])).toThrow(/duplicate/i);
  expect(() => run([{ ...blogPosts[0], date: '2026-02-30' }])).toThrow(/date/i);
  expect(() => run([{ ...blogPosts[0], title: '' }])).toThrow(/title/i);
});
