import { expect, test } from 'vitest';
import { getDictionary, validateDictionaries } from '../../lib/i18n/dictionaries';

test('both dictionaries have matching complete nonempty UI text', () => {
  expect(() => validateDictionaries(getDictionary('en'), getDictionary('zh'))).not.toThrow();
  expect(getDictionary('zh').nav.home).toBe('首页');
  expect(getDictionary('en').nav.home).toBe('Home');
});

test('missing Chinese navigation is an error with a useful path', () => {
  const zh = structuredClone(getDictionary('zh'));
  expect(() => validateDictionaries(getDictionary('en'), {
    ...zh, nav: { ...zh.nav, home: undefined },
  })).toThrow(/nav.home/);
});

test('empty translations cannot silently fall back to English', () => {
  const zh = structuredClone(getDictionary('zh'));
  zh.actions.activeBadge = '';
  expect(() => validateDictionaries(getDictionary('en'), zh)).toThrow(/actions.activeBadge/);
});
