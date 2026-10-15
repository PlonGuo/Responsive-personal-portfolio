import type { NextConfig } from 'next';
import blogSlugs from './content/blog-slugs.json';

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  typescript: { tsconfigPath: 'tsconfig.next.json' },
  async redirects() {
    return [
      { source: '/', destination: '/en', permanent: true },
      { source: '/lab', destination: '/en/lab', permanent: true },
      { source: '/blog', destination: '/en/blog', permanent: true },
      { source: '/blog/:slug', destination: '/en/blog/:slug', permanent: true },
      ...blogSlugs.map(slug => ({ source: `/zh/blog/${slug}`, destination: `/en/blog/${slug}`, permanent: true })),
    ];
  },
};

export default nextConfig;
