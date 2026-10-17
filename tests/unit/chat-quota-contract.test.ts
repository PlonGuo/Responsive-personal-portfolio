import { expect, test } from 'vitest';
import { normalizeUsageReport } from '../../lib/chat/contracts';
const report = { attempts: [{ provider: 'deepseek', inputTokens: 30, outputTokens: 7, totalTokens: 37 }], termination: 'complete' };
test('normalizes a missing total from known input/output without inventing unknown usage', () => {
  expect(normalizeUsageReport({ ...report, attempts: [{ ...report.attempts[0], totalTokens: null }] })).toEqual(report);
  expect(normalizeUsageReport({ ...report, attempts: [{ ...report.attempts[0], inputTokens: null, totalTokens: null }] })?.attempts[0].totalTokens).toBeNull();
});
test('explicit provider total wins over input plus output', () => {
  expect(normalizeUsageReport({ ...report, attempts: [{ ...report.attempts[0], totalTokens: 40 }] })?.attempts[0].totalTokens).toBe(40);
});
test.each([null, {}, { ...report, termination: 'bad' }, { ...report, attempts: 'bad' }, { ...report, attempts: [report.attempts[0], report.attempts[0], report.attempts[0]] },
  ...[-1, 1.2, Infinity, NaN, '37', Number.MAX_SAFE_INTEGER+1].map(totalTokens => ({ ...report, attempts: [{ ...report.attempts[0], totalTokens }] })),
  { ...report, attempts: [{ ...report.attempts[0], provider: 'other' }] },
  { ...report, attempts: [{ provider: 'legacy', inputTokens: null, outputTokens: null, totalTokens: null }, report.attempts[0]] },
  { ...report, attempts: [{ ...report.attempts[0], inputTokens: Number.MAX_SAFE_INTEGER, outputTokens: 1 }] },
  { ...report, attempts: [{ ...report.attempts[0], totalTokens: Number.MAX_SAFE_INTEGER }, report.attempts[0]] },
  { ...report, attempts: [{ provider: 'deepseek', totalTokens: 37 }] },
])('rejects malformed/unsafe usage rather than silently recording zero: %j', value => {
  expect(normalizeUsageReport(value)).toBeNull();
});
test('does not store provider extra metadata or unknown properties', () => {
  expect(normalizeUsageReport({ ...report, secret: 'private', attempts: [{ ...report.attempts[0], raw: 'private' }] })).toEqual(report);
});
test('accepts no attempts when a request ends before model invocation', () => {
  expect(normalizeUsageReport({ attempts: [], termination: 'aborted' })).toEqual({ attempts: [], termination: 'aborted' });
});
