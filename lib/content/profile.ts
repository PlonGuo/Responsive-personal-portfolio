import { shared } from '../../content/portfolio/shared';
import { en } from '../../content/portfolio/en';
import { zh } from '../../content/portfolio/zh';
import type { Locale } from '../i18n/locales';
import type { PortfolioProfile } from './types';

const texts = { en, zh };

export function getProfile(locale: Locale): PortfolioProfile {
  return structuredClone({ ...texts[locale].profile, stats: shared.stats });
}

export function getSkills() { return structuredClone(shared.skills); }
export function getSocialLinks() { return structuredClone(shared.socialLinks); }
export function getContactInfo() { return structuredClone(shared.contactInfo); }
export function getHeroLines(locale: Locale) { return [...texts[locale].heroLines]; }

export function getResumeHref(locale: Locale): string {
  return encodeURI(locale === 'en' ? '/Huizhirong Guo.pdf' : '/过汇智融-中文简历.pdf');
}

export function getEducation(locale: Locale) {
  return structuredClone(shared.education
    .map(meta => ({ ...texts[locale].education[meta.id], ...meta }))
    .sort((a, b) => b.year - a.year));
}

export function getExperience(locale: Locale) {
  return structuredClone(shared.experience
    .map(meta => ({ ...texts[locale].experience[meta.id], ...meta }))
    .sort((a, b) => b.year - a.year));
}
