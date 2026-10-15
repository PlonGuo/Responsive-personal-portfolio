import { afterEach, expect, test, vi } from 'vitest';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { locales, type Locale, type PageKind } from '../../lib/i18n/locales';
import { getPosts } from '../../lib/content/posts';
import { SITE_URL, getPageMetadata, getPostMetadata, getSitemapEntries, getIndexingRobots, getRobotsFile, formatShareTitle } from '../../lib/seo';

vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

for (const locale of locales) for (const page of ['home', 'lab', 'blog'] as const) {
  test(`${locale}/${page} has its own canonical, exact copy and reciprocal languages`, () => {
    const suffix = page === 'home' ? '' : `/${page}`;
    const metadata = getPageMetadata(locale, page);
    expect(metadata.metadataBase?.toString()).toBe('https://www.plonguo.com/');
    expect(metadata.title).toBe(getDictionary(locale).seo[page].title);
    expect(metadata.description).toBe(getDictionary(locale).seo[page].description);
    expect(metadata.alternates).toEqual({ canonical: `/${locale}${suffix}`, languages: {
      en: `/en${suffix}`, 'zh-CN': `/zh${suffix}`, 'x-default': `/en${suffix}`,
    } });
    expect(metadata.openGraph).toMatchObject({ type: 'website', url: `/${locale}${suffix}`,
      title: metadata.title, description: metadata.description, locale: locale === 'en' ? 'en_US' : 'zh_CN' });
    expect(metadata.twitter).toMatchObject({ title: metadata.title, description: metadata.description });
  });
}

test.each(getPosts())('article $slug preserves its title/excerpt and has no invented Chinese alternate', post => {
  const metadata = getPostMetadata(post);
  expect(metadata.title).toBe(post.title);
  expect(metadata.description).toBe(post.excerpt);
  expect(metadata.alternates).toEqual({ canonical: `/en/blog/${post.slug}` });
  expect(metadata.openGraph).toMatchObject({ type: 'article', url: `/en/blog/${post.slug}`, publishedTime: post.date,
    title: post.title, description: post.excerpt, tags: post.tags, locale: 'en_US' });
  expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: post.title, description: post.excerpt });
});

test('sitemap exactly enumerates bilingual shells and each English article once, with honest dates', () => {
  const entries = getSitemapEntries();
  const posts = getPosts();
  const shells = locales.flatMap(locale => ['', '/lab', '/blog'].map(suffix => `${SITE_URL}/${locale}${suffix}`));
  expect(entries.map(entry => entry.url).sort()).toEqual([...shells, ...posts.map(post => `${SITE_URL}/en/blog/${post.slug}`)].sort());
  expect(new Set(entries.map(entry => entry.url)).size).toBe(6 + posts.length);
  for (const entry of entries) {
    expect(new URL(entry.url).origin).toBe('https://www.plonguo.com');
    const post = posts.find(post => entry.url === `${SITE_URL}/en/blog/${post.slug}`);
    if (post) { expect(entry.lastModified).toBe(post.date); expect(entry.alternates).toBeUndefined(); }
    else {
      expect(entry.lastModified).toBeUndefined();
      const suffix = new URL(entry.url).pathname.replace(/^\/(en|zh)/, '');
      expect(entry.alternates?.languages).toEqual({
        en: `${SITE_URL}/en${suffix}`, 'zh-CN': `${SITE_URL}/zh${suffix}`, 'x-default': `${SITE_URL}/en${suffix}`,
      });
    }
  }
});

test.each(['production', 'preview', 'development', 'custom-staging', undefined])('indexing policy is explicit and consistent for VERCEL_ENV=%s', environment => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VERCEL_ENV', environment);
  const indexable = environment === 'production';
  expect(getIndexingRobots()).toEqual({ index: indexable, follow: indexable });
  const file = getRobotsFile();
  expect(file.sitemap).toBe('https://www.plonguo.com/sitemap.xml');
  expect(file.rules).toEqual(indexable ? { userAgent: '*', allow: '/', disallow: '/api/' } : { userAgent: '*', disallow: '/' });
});

test('page metadata rejects unsupported locales and page kinds', () => {
  expect(() => getPageMetadata('fr' as Locale, 'home')).toThrow();
  expect(() => getPageMetadata('zh', 'article' as PageKind)).toThrow();
});

test('share-card text has bounded Unicode length without modifying article metadata', () => {
  const title = '  A\n\t useful title  ';
  expect(formatShareTitle(title)).toBe('A useful title');
  const long = '🚀'.repeat(180);
  expect([...formatShareTitle(long)].length).toBeLessThanOrEqual(140);
  expect(formatShareTitle(long).endsWith('…')).toBe(true);
  const post = { ...getPosts()[0], title: long };
  expect(getPostMetadata(post).title).toBe(long);
});
