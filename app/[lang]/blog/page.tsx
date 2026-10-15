import { notFound } from 'next/navigation';
import { getPageMetadata } from '@/lib/seo';
import { isLocale, locales } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getPosts, getAllTags } from '@/lib/content/posts';
import BlogList from '@/src/components/blog/BlogList';

export function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return getPageMetadata(lang, 'blog');
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const posts = getPosts().map(post => ({
    slug: post.slug, title: post.title, excerpt: post.excerpt, date: post.date,
    tags: post.tags, readTime: post.readTime, coverImage: post.coverImage,
  }));
  return <BlogList posts={posts} tags={getAllTags()} locale={lang}
    copy={{ blog: dict.blog, actions: dict.actions }} />;
}
