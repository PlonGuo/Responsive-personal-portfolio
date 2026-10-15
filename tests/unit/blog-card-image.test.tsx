// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import BlogCard from '../../src/components/blog/BlogCard';
import { getDictionary } from '../../lib/i18n/dictionaries';

const post = { slug: 'test-cover', title: 'Cover image', excerpt: 'Test article', date: '2026-01-01', tags: [], coverImage: '/images/knowhive.png' };
test('optional blog cover reserves its container and supplies responsive optimized image candidates', () => {
  const html = renderToStaticMarkup(<BlogCard post={post} locale="en" copy={getDictionary('en')} />);
  const document = new DOMParser().parseFromString(html, 'text/html');
  const image = document.querySelector('img')!;
  expect(image.getAttribute('data-nimg')).toBe('fill');
  expect(image.getAttribute('srcset')).toContain('/_next/image?');
  expect(image.getAttribute('sizes')).toMatch(/vw/);
  expect(image.getAttribute('loading')).toBe('lazy');
  expect(image.getAttribute('alt')).toBe(post.title);
  expect(image.parentElement?.className).toMatch(/relative.*aspect-video/);
});
test('articles without a cover keep the original text-only card', () => {
  const html = renderToStaticMarkup(<BlogCard post={{ ...post, coverImage: undefined }} locale="zh" copy={getDictionary('zh')} />);
  expect(html).not.toContain('<img');
  expect(html).toContain('/en/blog/test-cover');
});
