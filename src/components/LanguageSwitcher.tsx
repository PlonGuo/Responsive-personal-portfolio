'use client';

import Link from 'next/link';
import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '../../lib/i18n/locales';
import { getLanguageTarget } from '../../lib/i18n/routes';
import { beginLanguageNavigation } from '../../lib/client/language-navigation';
import { useLanguageCopy, useLanguageNavigationState } from './LanguageNavigation';

export default function LanguageSwitcher({ locale, variant = 'desktop', onSelect }: {
  locale: Locale; variant?: 'desktop' | 'menu'; onSelect?: () => void;
}) {
  const copy = useLanguageCopy();
  const state = useLanguageNavigationState();
  const router = useRouter();
  const pathname = usePathname();
  const [showHint, setShowHint] = useState(false);
  const article = locale === 'en' && /^\/en\/blog\/[^/]+\/?$/.test(pathname);
  const select = (lang: Locale) => {
    if (lang === locale || state.pending) return;
    const target = getLanguageTarget(new URL(location.href), lang);
    if (!target) return;
    onSelect?.();
    void beginLanguageNavigation(target, router, variant === 'menu' ? 'mobile-menu-toggle' : 'language-desktop-toggle');
  };
  const prefetch = (lang: Locale) => {
    if (lang === locale) return;
    const target = getLanguageTarget(new URL(location.href), lang);
    if (target) { try { router.prefetch(target); } catch { /* Navigation never depends on prefetch. */ } }
  };
  if (variant === 'desktop') {
    const target = locale === 'en' ? 'zh' : 'en';
    const label = article ? copy.actions.chineseIndex : target === 'zh' ? copy.a11y.switchToChinese : copy.a11y.switchToEnglish;
    const control = {
      id: 'language-desktop-toggle',
      'aria-label': label,
      'aria-busy': state.pending,
      className: 'inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-base font-semibold text-blue-600 shadow-lg backdrop-blur-xl transition-colors hover:bg-primary-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 aria-disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100 dark:hover:bg-primary-dark',
      onMouseEnter: () => { setShowHint(true); prefetch(target); },
      onMouseLeave: () => setShowHint(false),
      onFocus: (event: FocusEvent<HTMLElement>) => {
        prefetch(target);
        if (event.currentTarget.matches(':focus-visible')) setShowHint(true);
      },
      onBlur: () => setShowHint(false),
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => { if (event.key === 'Escape') setShowHint(false); },
    };
    const glyph = <span aria-hidden="true">{target === 'zh' ? '中' : 'EN'}</span>;
    return <div className="language-dock fixed z-40 hidden md:flex">
      {article ? <Link {...control} href="/zh/blog" prefetch={false} aria-disabled={state.pending} inert={state.pending}
        onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault(); select(target);
        }}>{glyph}</Link> : <button {...control} type="button" disabled={state.pending} onClick={() => select(target)}>{glyph}</button>}
      <span id="language-desktop-tooltip" role="tooltip" hidden={!showHint || state.pending}
        className="pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{label}</span>
    </div>;
  }
  return <div className="col-span-2 border-t border-slate-200 pt-3 dark:border-slate-700 md:hidden">
    <div role="group" aria-label={copy.a11y.language} aria-busy={state.pending}
      className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-xl dark:border-slate-600 dark:bg-slate-800/95">
      {(['en', 'zh'] as const).map(lang => article && lang === 'zh' ? <Link key={lang}
        id={`language-${variant}-${lang}`} href="/zh/blog" prefetch={false} aria-disabled={state.pending}
        className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-slate-200 dark:hover:bg-slate-700"
        onMouseEnter={() => prefetch(lang)} onFocus={() => prefetch(lang)}
        onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault(); select(lang);
        }}>{copy.actions.chineseIndex}</Link> : <button key={lang} type="button"
        id={`language-${variant}-${lang}`} aria-pressed={lang === locale} disabled={state.pending}
        className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${lang === locale
          ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'}`}
        onMouseEnter={() => prefetch(lang)} onFocus={() => prefetch(lang)}
        onClick={() => select(lang)}>
        {lang === 'en' ? copy.actions.english : copy.actions.chinese}
      </button>)}
    </div>
  </div>;
}
