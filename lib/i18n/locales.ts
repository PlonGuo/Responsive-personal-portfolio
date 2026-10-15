export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];
export type PageKind = 'home' | 'lab' | 'blog';
export type SectionId = 'home' | 'about' | 'skills' | 'qualifications' | 'portfolio' | 'contact';
export const htmlLang = { en: 'en', zh: 'zh-CN' } as const;

export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'zh';
}
