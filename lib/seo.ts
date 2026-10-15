import 'server-only';
import type { Metadata, MetadataRoute } from 'next';
import { getDictionary } from './i18n/dictionaries';
import { isLocale, locales, type Locale, type PageKind } from './i18n/locales';
import { getPosts } from './content/posts';
import type { BlogPost } from '../src/types/blog';

export const SITE_URL = 'https://www.plonguo.com';

export function getIndexingRobots(): Metadata['robots'] {
  const indexable = process.env.VERCEL_ENV === 'production';
  return { index: indexable, follow: indexable };
}

export function getPageMetadata(locale: Locale, page: PageKind): Metadata {
  if (!isLocale(locale) || !['home', 'lab', 'blog'].includes(page)) throw new Error('Unsupported SEO page');
  const copy = getDictionary(locale).seo[page];
  const suffix = page === 'home' ? '' : `/${page}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: copy.title, description: copy.description,
    alternates: { canonical: `/${locale}${suffix}`, languages: {
      en: `/en${suffix}`, 'zh-CN': `/zh${suffix}`, 'x-default': `/en${suffix}`,
    } },
    openGraph: {
      type: 'website', title: copy.title, description: copy.description,
      url: `/${locale}${suffix}`, locale: locale === 'en' ? 'en_US' : 'zh_CN', siteName: 'Jason Guo',
    },
    twitter: { card: 'summary', title: copy.title, description: copy.description },
  };
}

export function getPostMetadata(post: BlogPost): Metadata {
  const url = `/en/blog/${post.slug}`;
  const image = { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: post.title };
  return {
    title: post.title, description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article', title: post.title, description: post.excerpt, url, locale: 'en_US',
      siteName: 'Jason Guo', publishedTime: post.date, tags: post.tags, images: [image],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [image] },
  };
}

export function getSitemapEntries(): MetadataRoute.Sitemap {
  return [
    ...locales.flatMap(locale => ['', '/lab', '/blog'].map(suffix => ({
      url: `${SITE_URL}/${locale}${suffix}`,
      alternates: { languages: {
        en: `${SITE_URL}/en${suffix}`, 'zh-CN': `${SITE_URL}/zh${suffix}`, 'x-default': `${SITE_URL}/en${suffix}`,
      } },
    }))),
    ...getPosts().map(post => ({ url: `${SITE_URL}/en/blog/${post.slug}`, lastModified: post.date })),
  ];
}

export function getRobotsFile(): MetadataRoute.Robots {
  return {
    rules: process.env.VERCEL_ENV === 'production'
      ? { userAgent: '*', allow: '/', disallow: '/api/' } : { userAgent: '*', disallow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

export function formatShareTitle(title: string): string {
  const characters = [...title.replace(/\s+/g, ' ').trim()];
  return characters.length > 140 ? characters.slice(0, 139).join('') + '…' : characters.join('');
}
