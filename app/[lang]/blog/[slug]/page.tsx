import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getPosts, getPost } from '@/lib/content/posts';
import BlogPostBody from '@/src/components/blog/BlogPostBody';
import { getPostMetadata } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return getPosts().map(post => ({ lang: 'en', slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (lang !== 'en') notFound();
  const post = getPost(slug);
  if (!post) notFound();
  return getPostMetadata(post);
}

export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (lang !== 'en') notFound();
  const post = getPost(slug);
  if (!post) notFound();
  const copy = getDictionary('en');
  return <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-28 dark:bg-slate-900">
    <div className="mx-auto min-w-0 max-w-3xl">
      <header className="mb-6">
        <Link href="/en/blog" className="mb-7 inline-flex items-center gap-2 text-slate-500 hover:text-primary dark:text-slate-400">
          <ArrowLeft size={16} />{copy.actions.backBlog}
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Calendar size={16} />
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</time>
          </span>
          {post.readTime && <span className="inline-flex items-center gap-1.5"><Clock size={16} />{copy.blog.readTime.replace('{count}', String(post.readTime))}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => <Link key={tag} href={`/en/blog?${new URLSearchParams({ tag })}`}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">{tag}</Link>)}
        </div>
      </header>
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="mb-8 w-full rounded-2xl" />}
      <BlogPostBody source={post.content} />
    </div>
  </main>;
}
