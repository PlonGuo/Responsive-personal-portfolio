import { expect, test, type Page } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
type SEOCopy = { seo: Record<'home' | 'lab' | 'blog', { title: string; description: string }> };
const slugs = JSON.parse(readFileSync('content/blog-slugs.json', 'utf8')) as string[];
const en = JSON.parse(readFileSync('lib/i18n/messages/en.json', 'utf8')) as SEOCopy;
const zh = JSON.parse(readFileSync('lib/i18n/messages/zh.json', 'utf8')) as SEOCopy;

const origin = 'https://plonguo.com';
const indexable = process.env.PORTFOLIO_EXPECT_INDEXING !== 'preview';
const evidence = '/tmp/portfolio-bilingual-evidence';
mkdirSync(evidence, { recursive: true });
const posts = slugs.map(slug => matter(readFileSync(`content/posts/${slug}.mdx`, 'utf8')).data as {
  slug: string; title: string; excerpt: string; date: string; tags: string[];
});
async function assertIndexing(page: Page) {
  const value = await page.locator('head meta[name="robots"]').getAttribute('content');
  expect(value?.split(/,\s*/).sort()).toEqual(indexable ? ['follow', 'index'] : ['nofollow', 'noindex']);
}
async function assertLanguages(page: Page, suffix: string) {
  const links = await page.locator('head link[rel="alternate"][hreflang]').evaluateAll(nodes => nodes.map(node => ({
    language: node.getAttribute('hreflang'), url: node.getAttribute('href'),
  })));
  expect(links.sort((a, b) => a.language!.localeCompare(b.language!))).toEqual([
    { language: 'en', url: `${origin}/en${suffix}` },
    { language: 'zh-CN', url: `${origin}/zh${suffix}` },
    { language: 'x-default', url: `${origin}/en${suffix}` },
  ].sort((a, b) => a.language.localeCompare(b.language)));
}

test('all six bilingual pages expose complete metadata in the initial HTML with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  for (const locale of ['en', 'zh'] as const) for (const kind of ['home', 'lab', 'blog'] as const) {
    await test.step(`${locale}/${kind}`, async () => {
      const suffix = kind === 'home' ? '' : `/${kind}`;
      const copy = (locale === 'en' ? en : zh).seo[kind];
      const response = await page.goto(`/${locale}${suffix}`);
      expect(response?.status()).toBe(200);
      writeFileSync(`${evidence}/PB-09-${indexable ? 'production' : 'preview'}-${locale}-${kind}.html`, await response!.text());
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en');
      await expect(page).toHaveTitle(copy.title);
      await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', copy.description);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/${locale}${suffix}`);
      for (const [property, value] of Object.entries({ 'og:title': copy.title, 'og:description': copy.description,
        'og:url': `${origin}/${locale}${suffix}`, 'og:type': 'website', 'og:locale': locale === 'zh' ? 'zh_CN' : 'en_US' })) {
        await expect(page.locator(`head meta[property="${property}"]`)).toHaveAttribute('content', value);
      }
      await assertLanguages(page, suffix); await assertIndexing(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
  await context.close();
});

test('every English article has its own exact title, excerpt, canonical and share data with no Chinese alternate', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles: string[] = [];
  for (const post of posts) {
    await test.step(post.slug, async () => {
      const response = await page.goto(`/en/blog/${post.slug}`);
      expect(response?.status()).toBe(200);
      writeFileSync(`${evidence}/PB-09-${indexable ? 'production' : 'preview'}-article-${post.slug}.html`, await response!.text());
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(post.title);
      titles.push((await page.locator('head title').textContent())!);
      await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', post.excerpt);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/en/blog/${post.slug}`);
      await expect(page.locator('head link[hreflang]')).toHaveCount(0);
      for (const [property, value] of Object.entries({ 'og:title': post.title, 'og:description': post.excerpt,
        'og:url': `${origin}/en/blog/${post.slug}`, 'og:type': 'article', 'og:locale': 'en_US', 'article:published_time': post.date })) {
        await expect(page.locator(`head meta[property="${property}"]`)).toHaveAttribute('content', value);
      }
      expect(await page.locator('head meta[property="article:tag"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('content')))).toEqual(post.tags);
      const image = new URL((await page.locator('head meta[property="og:image"]').first().getAttribute('content'))!);
      expect(image.origin).toBe(origin); expect(image.pathname).toBe(`/en/blog/${post.slug}/opengraph-image`);
      await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      await expect(page.locator('head meta[name="twitter:title"]')).toHaveAttribute('content', post.title);
      await assertIndexing(page);
    });
  }
  expect(new Set(titles).size).toBe(posts.length);
  await context.close();
});

test('sitemap XML exactly matches the formal route set, language pairs and known article dates', async ({ request, page }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  writeFileSync(`${evidence}/PB-09-sitemap-${indexable ? 'production' : 'preview'}.xml`, xml);
  const parsed = await page.evaluate(source => {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
    return { invalid: !!document.querySelector('parsererror'), entries: [...document.getElementsByTagNameNS(ns, 'url')].map(node => ({
      url: node.getElementsByTagNameNS(ns, 'loc')[0]?.textContent,
      date: node.getElementsByTagNameNS(ns, 'lastmod')[0]?.textContent ?? null,
      languages: [...node.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link')].map(link => ({
        language: link.getAttribute('hreflang'), url: link.getAttribute('href'),
      })),
    })) };
  }, xml);
  expect(parsed.invalid).toBe(false);
  const shells = ['en', 'zh'].flatMap(locale => ['', '/lab', '/blog'].map(suffix => `${origin}/${locale}${suffix}`));
  const expected = [...shells, ...posts.map(post => `${origin}/en/blog/${post.slug}`)].sort();
  expect(parsed.entries.map(entry => entry.url).sort()).toEqual(expected);
  expect(new Set(parsed.entries.map(entry => entry.url)).size).toBe(expected.length);
  for (const entry of parsed.entries) {
    const post = posts.find(post => entry.url === `${origin}/en/blog/${post.slug}`);
    if (post) { expect(entry.date).toBe(post.date); expect(entry.languages).toEqual([]); }
    else {
      expect(entry.date).toBeNull();
      const suffix = new URL(entry.url!).pathname.replace(/^\/(en|zh)/, '');
      expect(entry.languages).toEqual([
        { language: 'en', url: `${origin}/en${suffix}` }, { language: 'zh-CN', url: `${origin}/zh${suffix}` },
        { language: 'x-default', url: `${origin}/en${suffix}` },
      ]);
    }
  }
});

test('robots permits production indexing and blocks preview/development while advertising the formal sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  writeFileSync(`${evidence}/PB-09-robots-${indexable ? 'production' : 'preview'}.txt`, text);
  expect(text).toContain('User-Agent: *');
  expect(text).toContain('Sitemap: https://plonguo.com/sitemap.xml');
  if (indexable) { expect(text).toContain('Allow: /'); expect(text).not.toMatch(/^Disallow: \/$/m); }
  else expect(text).toMatch(/^Disallow: \/$/m);
});

test('each article share endpoint produces a distinct 1200 by 630 PNG', async ({ request }) => {
  const hashes = new Set<string>();
  for (const post of posts) {
    const response = await request.get(`/en/blog/${post.slug}/opengraph-image`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\/png/);
    const bytes = await response.body();
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.readUInt32BE(16)).toBe(1200); expect(bytes.readUInt32BE(20)).toBe(630);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
    writeFileSync(`${evidence}/PB-09-og-${post.slug}.png`, bytes);
  }
  expect(hashes.size).toBe(posts.length);
});

test('unknown articles and Chinese or unsupported-language share endpoints return genuine 404s', async ({ request }) => {
  for (const path of ['/en/blog/not-a-real-post', '/zh/blog/not-a-real-post', '/en/blog/not-a-real-post/opengraph-image',
    '/zh/blog/why-i-chose-cs/opengraph-image', '/fr/blog/why-i-chose-cs/opengraph-image']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(response.headers()['content-type']).not.toMatch(/^image\/png/);
  }
});

test('tag query URLs retain the formal directory canonical without inventing a new localized page', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/zh/blog?tag=AI');
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/zh/blog`);
  await assertLanguages(page, '/blog');
  await context.close();
});

test('client language navigation updates the browser title and canonical without a document reload', async ({ page }) => {
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let documents = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documents++; });
  await page.goto('/en');
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page).toHaveTitle(zh.seo.home.title);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/zh`);
  await assertLanguages(page, '');
  expect(documents).toBe(1);
});
