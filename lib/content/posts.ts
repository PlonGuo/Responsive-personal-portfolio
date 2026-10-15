import 'server-only';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import slugs from '../../content/blog-slugs.json';
import type { BlogPost } from '../../src/types/blog';
import { isPostSlug, validatePostMetadata, validatePostSlugs } from './blog-schema';

const directory = join(process.cwd(), 'content', 'posts');
function readPost(slug: string): BlogPost {
  const { data, content } = matter(readFileSync(join(directory, slug + '.mdx'), 'utf8'));
  validatePostMetadata(data);
  if (data.slug !== slug || !content.trim()) throw new Error(`Invalid blog file: ${slug}`);
  return { ...structuredClone(data), content };
}

export function validateBlogContent() {
  validatePostSlugs(slugs);
  const files = readdirSync(directory).filter(file => file.endsWith('.mdx')).sort();
  if (JSON.stringify(files) !== JSON.stringify(slugs.map(slug => slug + '.mdx').sort())) throw new Error('Blog manifest does not match article files');
  for (const slug of slugs) readPost(slug);
}

export function getPosts(): BlogPost[] {
  validatePostSlugs(slugs);
  return slugs.map(readPost).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
export function getPost(slug: string): BlogPost | undefined {
  if (!isPostSlug(slug) || !slugs.includes(slug)) return undefined;
  return readPost(slug);
}
export function getLatestPosts(count = 3): BlogPost[] { return getPosts().slice(0, count); }
export function getAllTags(): string[] { return [...new Set(getPosts().flatMap(post => post.tags))].sort(); }
