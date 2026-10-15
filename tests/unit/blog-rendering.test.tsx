import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { expect, test, vi } from 'vitest';
import { getPosts } from '../../lib/content/posts';
import BlogPostBody from '../../src/components/blog/BlogPostBody';

vi.mock('server-only', () => ({}));
const documentOf = (html: string) => new JSDOM(html).window.document;
const visibleText = (document: Document) => [...document.querySelectorAll('h1,h2,h3,h4,p,li,th,td')].map(element => element.textContent?.replace(/\s+/g, ' ').trim());

test.each(getPosts())('renders all prose, code, links and ASCII unchanged for $slug', async post => {
  const baseline = documentOf(renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>));
  const rendered = documentOf(renderToStaticMarkup(await BlogPostBody({ source: post.content })));
  expect(visibleText(rendered)).toEqual(visibleText(baseline));
  const codeText = (document: Document) => [...document.querySelectorAll('pre')].map(element => element.textContent?.trimEnd());
  expect(codeText(rendered)).toEqual(codeText(baseline));
  const links = (document: Document) => [...document.querySelectorAll('a')].map(element => [element.textContent, element.getAttribute('href')]);
  expect(links(rendered)).toEqual(links(baseline));
});

test('renders nested lists, an image and a GFM table as semantic HTML', async () => {
  const source = '# Title\n\n- Parent\n  - Child\n\n![Example](/images/jason-clipart.jpg)\n\n| A | B |\n| - | - |\n| One | Two |';
  const rendered = documentOf(renderToStaticMarkup(await BlogPostBody({ source })));
  expect(rendered.querySelector('ul ul li')?.textContent).toBe('Child');
  expect(rendered.querySelector('img')?.getAttribute('alt')).toBe('Example');
  expect(rendered.querySelector('img')?.getAttribute('src')).toBe('/images/jason-clipart.jpg');
  expect(rendered.querySelector('table tbody tr')?.textContent).toBe('OneTwo');
});
