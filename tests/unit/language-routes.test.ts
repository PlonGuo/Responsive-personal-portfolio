import { expect, test } from 'vitest';
import { getLanguageTarget } from '../../lib/i18n/routes';

test.each([
  ['/en?tag=AI#portfolio', 'zh', '/zh?tag=AI#portfolio'],
  ['/zh#contact', 'en', '/en#contact'],
  ['/en/lab?source=home', 'zh', '/zh/lab?source=home'],
  ['/zh/blog?tag=AI&tag=React#unknown', 'en', '/en/blog?tag=AI&tag=React'],
  ['/en#missing', 'zh', '/zh'],
  ['/en/blog/why-i-chose-cs?ref=home#intro', 'zh', '/zh/blog?ref=home'],
  ['/fr', 'zh', null], ['/en/unknown', 'zh', null], ['/zh/blog/unknown', 'en', null],
] as const)('maps %s to %s without losing valid state', (path, target, expected) => {
  expect(getLanguageTarget(new URL(path, 'https://plonguo.com'), target)).toBe(expected);
});
