import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPost, getPosts } from '@/lib/content/posts';
import { formatShareTitle } from '@/lib/seo';

export const alt = 'Jason Guo — English engineering article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map(post => ({ lang: 'en', slug: post.slug }));
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const post = lang === 'en' ? getPost(slug) : undefined;
  if (!post) return new Response('Not Found', { status: 404 });
  const font = await readFile(join(process.cwd(), 'lib/assets/noto-sans-sc-700.ttf'));
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      background: 'linear-gradient(125deg, #0f172a 0%, #172554 70%, #312e81 100%)', color: '#f8fafc', padding: '64px 72px',
      fontFamily: 'Noto Sans SC', fontWeight: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24 }}>
        <div style={{ display: 'flex', color: '#93c5fd', letterSpacing: 3 }}>ENGINEERING NOTES</div>
        <div style={{ display: 'flex', color: '#cbd5e1' }}>Jason Guo</div>
      </div>
      <div style={{ display: 'flex', fontSize: 56, lineHeight: 1.3, maxHeight: 300, overflow: 'hidden', wordBreak: 'break-word' }}>
        {formatShareTitle(post.title)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #475569', paddingTop: 24, fontSize: 22 }}>
        <div style={{ display: 'flex', color: '#cbd5e1' }}>{post.date} · English article</div>
        <div style={{ display: 'flex', color: '#93c5fd' }}>plonguo.com</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Noto Sans SC', data: font, weight: 700, style: 'normal' }] },
  );
}
