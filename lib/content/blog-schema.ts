import type { BlogPostMeta } from '../../src/types/blog';

export const isPostSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export function validatePostMetadata(value: unknown): asserts value is BlogPostMeta {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid blog metadata');
  const post = value as Record<string, unknown>;
  for (const field of ['slug', 'title', 'excerpt', 'date'] as const) {
    if (typeof post[field] !== 'string' || !post[field].trim()) throw new Error(`Missing blog ${field}`);
  }
  if (!isPostSlug(post.slug as string)) throw new Error('Invalid blog slug');
  const date = post.date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))
    || new Date(date).toISOString().slice(0, 10) !== date) throw new Error(`Invalid blog date: ${date}`);
  if (!Array.isArray(post.tags) || !post.tags.length || post.tags.some(tag => typeof tag !== 'string' || !tag.trim())) throw new Error('Invalid blog tags');
  if (post.readTime !== undefined && (typeof post.readTime !== 'number' || !Number.isFinite(post.readTime) || post.readTime <= 0)) throw new Error('Invalid blog readTime');
  if (post.coverImage !== undefined && (typeof post.coverImage !== 'string' || !post.coverImage.trim())) throw new Error('Invalid blog coverImage');
}

export function validatePostSlugs(slugs: unknown): asserts slugs is string[] {
  if (!Array.isArray(slugs) || slugs.some(slug => typeof slug !== 'string' || !isPostSlug(slug))) throw new Error('Invalid blog slug manifest');
  if (new Set(slugs).size !== slugs.length) throw new Error('Duplicate blog slug');
}
