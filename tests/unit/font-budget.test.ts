import { expect, test } from 'vitest';
import { assessFontBudget, FONT_BUDGET_BYTES } from '../../scripts/check-font-budget.mjs';

const valid = () => ({
  path: '/zh',
  requests: ['http://localhost:3000/_next/static/media/noto.woff2'],
  fonts: [{ url: 'http://localhost:3000/_next/static/media/noto.woff2', bytes: 230000 }],
  usedFonts: [{ familyName: 'Noto Sans SC', isCustomFont: true, glyphCount: 6 }],
});

test('a loaded same-origin face at the exact budget passes', () => {
  const record = valid(); record.fonts[0].bytes = FONT_BUDGET_BYTES;
  expect(assessFontBudget(record, 'http://localhost:3000').errors).toEqual([]);
});
test('the total counts every font file and a one-byte budget actually fails', () => {
  const record = valid(); record.fonts.push({ ...record.fonts[0], url: record.fonts[0].url + '?bold', bytes: 300000 });
  expect(assessFontBudget(record, 'http://localhost:3000').errors).toContain('Font budget exceeded: 530000 > 512000');
  expect(assessFontBudget(valid(), 'http://localhost:3000', 1).errors).toContain('Font budget exceeded: 230000 > 1');
});
test('external font or Google CSS requests fail even when blocked', () => {
  for (const external of ['https://fonts.googleapis.com/css2?family=Noto+Sans+SC', 'https://fonts.gstatic.com/noto.woff2', 'https://other.test/font.woff2', 'https://other.test/font?id=123']) {
    const record = valid(); record.requests.push(external);
    expect(assessFontBudget(record, 'http://localhost:3000').errors.join(' ')).toContain('External font request');
  }
});
test('no responses, zero bytes or a fallback-only heading cannot pass', () => {
  const empty = valid(); empty.fonts = [];
  expect(assessFontBudget(empty, 'http://localhost:3000').errors.join(' ')).toContain('No font responses');
  const cached = valid(); cached.fonts[0].bytes = 0;
  expect(assessFontBudget(cached, 'http://localhost:3000').errors.join(' ')).toContain('Unmeasurable font response');
  const fallback = valid(); fallback.usedFonts[0].isCustomFont = false;
  expect(assessFontBudget(fallback, 'http://localhost:3000').errors.join(' ')).toContain('Noto Sans SC is not rendering');
});
test('a budget override cannot increase or invalidate the approved limit', () => {
  for (const budget of [FONT_BUDGET_BYTES + 1, 0, -1, NaN]) {
    expect(() => assessFontBudget(valid(), 'http://localhost:3000', budget)).toThrow('Budget must be');
  }
});
test('one failing face cannot pass just because the other heading face works', () => {
  expect(assessFontBudget({ ...valid(), failedFonts: ['sans 400'] }, 'http://localhost:3000').errors).toContain('Failed font: sans 400');
});
