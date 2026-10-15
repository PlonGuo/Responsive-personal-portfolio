import localFont from 'next/font/local';

export const sans = localFont({
  src: [
    { path: '../public/fonts/noto-sans-sc-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/noto-sans-sc-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  fallback: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
  adjustFontFallback: false,
});
