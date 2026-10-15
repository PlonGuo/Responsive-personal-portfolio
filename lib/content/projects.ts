import { shared } from '../../content/portfolio/shared';
import { en } from '../../content/portfolio/en';
import { zh } from '../../content/portfolio/zh';
import type { Locale } from '../i18n/locales';
import type { LocalizedProject } from './types';

const texts = { en, zh };

export function getProjects(locale: Locale): LocalizedProject[] {
  return structuredClone(shared.projects
    .map(meta => ({ ...meta, ...texts[locale].projects[meta.id] }))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.year - a.year));
}

export function getProject(locale: Locale, id: string): LocalizedProject | undefined {
  return getProjects(locale).find(project => project.id === id);
}

export function getFeaturedProjects(locale: Locale, limit = 6): LocalizedProject[] {
  return getProjects(locale).slice(0, limit);
}

export function getProjectsByYear(locale: Locale): Array<[number, LocalizedProject[]]> {
  const groups = new Map<number, LocalizedProject[]>();
  for (const project of getProjects(locale)) {
    const bucket = groups.get(project.year) ?? [];
    bucket.push(project);
    groups.set(project.year, bucket);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid object: ${path}`);
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing text: ${path}`);
}

export function validatePortfolioContent(sources: { shared: unknown; en: unknown; zh: unknown } = { shared, en, zh }): void {
  const facts = record(sources.shared, 'shared');
  const english = record(sources.en, 'en');
  const chinese = record(sources.zh, 'zh');
  const groups = {
    projects: { required: ['title', 'description'], allowed: ['title', 'tagline', 'description', 'highlights'] },
    education: { required: ['degree', 'school', 'period'], allowed: ['degree', 'school', 'period', 'college', 'location', 'note'] },
    experience: { required: ['title', 'company', 'period'], allowed: ['title', 'company', 'period', 'companyNote', 'location', 'summary', 'highlights', 'description'] },
  };

  for (const [group, rules] of Object.entries(groups)) {
    const entities = facts[group];
    if (!Array.isArray(entities) || entities.length === 0) throw new Error(`Missing entities: ${group}`);
    const ids = new Set<string>();
    const enTexts = record(english[group], `en.${group}`);
    const zhTexts = record(chinese[group], `zh.${group}`);
    for (const item of entities as unknown[]) {
      const meta = record(item, `shared.${group}`);
      text(meta.id, `${group}.id`);
      const id = meta.id as string;
      if (ids.has(id)) throw new Error(`Duplicate ${group} id: ${id}`);
      ids.add(id);
      if (!Number.isInteger(meta.year)) throw new Error(`Invalid year: ${group}.${id}`);
      if (group === 'projects') {
        if (typeof meta.showActiveBadge !== 'boolean') throw new Error(`Invalid showActiveBadge: ${id}`);
        text(meta.image, `${id}.image`);
        if (!Array.isArray(meta.technologies) || !meta.technologies.length) throw new Error(`Missing technologies: ${id}`);
        for (const technology of meta.technologies as unknown[]) text(technology, `${id}.technologies`);
      }

      for (const [locale, collection] of [['en', enTexts], ['zh', zhTexts]] as const) {
        const localized = record(collection[id], `${locale}.${group}.${id}`);
        for (const key of rules.required) text(localized[key], `${locale}.${group}.${id}.${key}`);
        for (const [key, value] of Object.entries(localized)) {
          if (!rules.allowed.includes(key)) throw new Error(`Unexpected metadata: ${locale}.${group}.${id}.${key}`);
          if (key === 'highlights') {
            if (!Array.isArray(value)) throw new Error(`Invalid highlights: ${id}`);
            for (const highlight of value as unknown[]) text(highlight, `${locale}.${group}.${id}.highlights`);
          } else text(value, `${locale}.${group}.${id}.${key}`);
        }
      }
      const enHighlights = record(enTexts[id], id).highlights;
      const zhHighlights = record(zhTexts[id], id).highlights;
      if ((Array.isArray(enHighlights) ? enHighlights.length : 0) !== (Array.isArray(zhHighlights) ? zhHighlights.length : 0)) {
        throw new Error(`Highlight count mismatch: ${id}`);
      }
    }
    for (const [locale, collection] of [['en', enTexts], ['zh', zhTexts]] as const) {
      for (const id of Object.keys(collection)) if (!ids.has(id)) throw new Error(`Unknown entity: ${locale}.${group}.${id}`);
    }
  }

  for (const [locale, localized] of [['en', english], ['zh', chinese]] as const) {
    const profile = record(localized.profile, `${locale}.profile`);
    for (const key of ['name', 'shortName', 'title', 'bio', 'aboutDescription']) text(profile[key], `${locale}.profile.${key}`);
    for (const [name, value] of [['focus', profile.focus], ['heroLines', localized.heroLines]] as const) {
      if (!Array.isArray(value) || !value.length) throw new Error(`Missing ${locale}.${name}`);
      for (const line of value as unknown[]) text(line, `${locale}.${name}`);
    }
  }
}
