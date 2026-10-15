import 'server-only';
import type { ComponentProps } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

// Only the repository's validated article files may reach this compiler.
export default async function BlogPostBody({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: {
      blockJS: true,
      blockDangerousJS: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, {
          grid: false,
          theme: { light: 'github-light', dark: 'github-dark' },
          bypassInlineCode: true,
          defaultLang: 'plaintext',
        }]],
      },
    },
    components: {
      pre: (props: ComponentProps<'pre'>) => <pre tabIndex={0} {...props} />,
      table: (props: ComponentProps<'table'>) => <div className="blog-table-scroll"><table {...props} /></div>,
      a: ({ href, ...props }: ComponentProps<'a'>) => <a href={href} {...props}
        {...(/^https?:\/\//.test(href ?? '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />,
    },
  });
  return <article className="blog-prose">{content}</article>;
}
