import { expect, test } from 'vitest';
import { getErrorMessage, getUIErrorCode } from '../../lib/i18n/errors';
import { getDictionary } from '../../lib/i18n/dictionaries';

test.each([
  [429, undefined, 'rateLimit'], [400, 'VALIDATION', 'validation'],
  [403, 'VERIFICATION_FAILED', 'verification'], [403, 'VALIDATION', 'validation'],
  [503, 'SERVER_ERROR', 'generic'], [500, 'private stack', 'generic'], [403, undefined, 'generic'],
] as const)('maps API %s/%s without exposing private messages', (status, code, expected) => {
  expect(getUIErrorCode(status, code)).toBe(expected);
});
test('the same stored error changes presentation language without changing history', () => {
  expect(getErrorMessage('rateLimit', getDictionary('en'))).toContain('Too many');
  expect(getErrorMessage('rateLimit', getDictionary('zh'))).not.toContain('Too many');
});
