import en from './messages/en.json';
import zh from './messages/zh.json';
import type { Locale } from './locales';
import type { Dictionary } from './types';

function collectLeaves(value: unknown, path = ''): string[] {
  if (typeof value === 'string') {
    if (!value.trim()) throw new Error(`Empty translation: ${path}`);
    return [path];
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid translation: ${path}`);
  }
  return Object.entries(value).flatMap(([key, child]) => collectLeaves(child, path ? `${path}.${key}` : key));
}

export function validateDictionaries(english: unknown, chinese: unknown): void {
  const expected = new Set(collectLeaves(english));
  const actual = new Set(collectLeaves(chinese));
  for (const key of expected) if (!actual.has(key)) throw new Error(`Missing translation: ${key}`);
  for (const key of actual) if (!expected.has(key)) throw new Error(`Unexpected translation: ${key}`);
}

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
