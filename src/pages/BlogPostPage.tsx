import type { ReactNode } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { getPostBySlug } from '../data/blog-posts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Simple markdown-like rendering for blog content
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = '';

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre
              key={`code-${index}`}
              className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 text-sm"
            >
              <code className={`language-${codeLanguage}`}>
                {codeContent.join('\n')}
              </code>
            </pre>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={index}
            className="text-3xl font-heading font-bold text-slate-900 dark:text-white mt-8 mb-4"
          >
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={index}
            className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-8 mb-4"
          >
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={index}
            className="text-xl font-heading font-semibold text-slate-900 dark:text-white mt-6 mb-3"
          >
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // Horizontal rule
      if (line === '---') {
        elements.push(
          <hr
            key={index}
            className="border-slate-200 dark:border-slate-700 my-8"
          />
        );
        return;
      }

      // List items
      if (line.startsWith('- ')) {
        elements.push(
          <li
            key={index}
            className="text-slate-600 dark:text-slate-400 ml-4 list-disc"
          >
            {renderInlineContent(line.slice(2))}
          </li>
        );
        return;
      }

      // Numbered list items
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li
            key={index}
            className="text-slate-600 dark:text-slate-400 ml-4 list-decimal"
          >
            {renderInlineContent(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
        return;
      }

      // Empty line
      if (line.trim() === '') {
        elements.push(<div key={index} className="h-4" />);
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={index} className="text-slate-600 dark:text-slate-400 my-4 leading-relaxed">
          {renderInlineContent(line)}
        </p>
      );
    });

    return elements;
  };

  // Render inline content (bold, italic, code, links)
  const renderInlineContent = (text: string): ReactNode => {
    // Simple inline code
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="bg-slate-100 dark:bg-slate-800 text-primary px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Bold text
      if (part.includes('**')) {
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((bp, j) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            return (
              <strong key={`${i}-${j}`} className="font-semibold text-slate-900 dark:text-white">
                {bp.slice(2, -2)}
              </strong>
            );
          }
          return bp;
        });
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Post header */}
          <header className="mb-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 dark:text-white mb-4">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.date)}
              </div>
              {post.readTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readTime} min read
                </div>
              )}
            </div>
          </header>

          {/* Post content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all posts
            </Link>
          </footer>
        </motion.div>
      </article>
    </div>
  );
}
