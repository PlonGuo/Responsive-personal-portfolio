'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import type { BlogPostMeta } from '../../types/blog';
import type { Locale } from '../../../lib/i18n/locales';
import type { Dictionary } from '../../../lib/i18n/types';

interface BlogCardProps {
  post: BlogPostMeta;
  locale: Locale;
  copy: Pick<Dictionary, "blog">;
  index?: number;
}

export default function BlogCard({ post, index = 0, locale, copy }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Link
        href={`/en/blog/${post.slug}`}
        className="block h-full bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      >
        {/* Cover Image (if available) */}
        {post.coverImage && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-700">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(min-width: 928px) 388px, (min-width: 768px) calc((100vw - 152px) / 2), calc(100vw - 80px)"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(post.date)}
          </div>
          {post.readTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {copy.blog.readTime.replace("{count}", String(post.readTime))}
            </div>
          )}
        </div>

        {locale === 'zh' && <span className="mb-2 inline-block text-xs text-primary">{copy.blog.englishArticle}</span>}
        {/* Title */}
        <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.article>
  );
}
