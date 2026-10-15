'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BlogPostMeta } from '../../types/blog';
import type { Locale } from '../../../lib/i18n/locales';
import type { Dictionary } from '../../../lib/i18n/types';
import BlogCard from './BlogCard';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener('portfolio-query', listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener('portfolio-query', listener);
  };
}

export default function BlogList({ posts, tags, locale, copy }: {
  posts: BlogPostMeta[]; tags: string[]; locale: Locale;
  copy: Pick<Dictionary, 'blog' | 'actions'>;
}) {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  const selected = new URLSearchParams(search).get('tag')?.toLowerCase() ?? null;
  const filtered = selected ? posts.filter(post => post.tags.some(tag => tag.toLowerCase() === selected)) : posts;
  const selectTag = (tag: string | null) => {
    const url = new URL(window.location.href);
    if (tag) url.searchParams.set('tag', tag);
    else url.searchParams.delete('tag');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event('portfolio-query'));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-2 text-slate-500 hover:text-primary">
          <ArrowLeft size={16} />{copy.actions.backHome}
        </Link>
        <h1 className="mb-4 font-heading text-4xl font-bold text-slate-900 dark:text-white">{copy.blog.title}</h1>
        <p className="mb-8 text-slate-600 dark:text-slate-400">{copy.blog.subtitle}</p>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{copy.blog.filter}</p>
        <div className="mb-10 flex flex-wrap gap-2">
          {[null, ...tags].map(tag => (
            <button key={tag ?? 'all'} type="button" onClick={() => selectTag(tag)} aria-pressed={selected === (tag?.toLowerCase() ?? null)}
              className={`rounded-full px-3 py-1.5 text-sm ${selected === (tag?.toLowerCase() ?? null) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
              {tag ?? copy.blog.all}
            </button>
          ))}
        </div>
        {filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((post, index) => <BlogCard key={post.slug} post={post} index={index} locale={locale} copy={copy} />)}
          </div>
        ) : <p role="status" className="py-12 text-center text-slate-500">{copy.blog.empty}</p>}
      </div>
    </main>
  );
}
