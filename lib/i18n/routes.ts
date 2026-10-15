import { isLocale, type Locale, type SectionId } from './locales';

export const homeSections: readonly SectionId[] = ['home', 'about', 'skills', 'qualifications', 'portfolio', 'contact'];

export function getLanguageTarget(current: URL, target: Locale): string | null {
  if (!isLocale(target)) return null;
  const segments = current.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (!isLocale(segments[0])) return null;
  const page = segments.slice(1).join('/');
  if (segments[0] === 'en' && /^blog\/[^/]+$/.test(page)) {
    return target === 'zh' ? `/zh/blog${current.search}` : current.pathname + current.search + current.hash;
  }
  if (page !== '' && page !== 'lab' && page !== 'blog') return null;
  const hash = page === '' && homeSections.includes(current.hash.slice(1) as SectionId) ? current.hash : '';
  return `/${target}${page ? `/${page}` : ''}${current.search}${hash}`;
}
