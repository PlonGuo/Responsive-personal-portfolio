import { createClient } from '@supabase/supabase-js';
import { expect, test, vi } from 'vitest';
import { createChatLimiter } from '../../lib/api/chat-rate-limit';

const row = { request_count: 1, token_count: 2, window_start: new Date().toISOString() };
function setup(read: unknown = row, writeFails = false, readFails = false, missingOnWrite = false) {
  const transport = vi.fn<typeof fetch>(async (_url, options) => {
    if (!options?.method || options.method === 'GET') {
      return new Response(JSON.stringify(readFails ? { code: 'database-offline', message: 'private error' } : read), {
        status: readFails ? 503 : 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    const key = options?.method === 'POST'
      ? JSON.parse(String(options.body)).ip_session_key
      : new URL(String(_url)).searchParams.get('ip_session_key')?.slice(3);
    return new Response(JSON.stringify(writeFails ? { code: 'write-error', message: 'private error' } : missingOnWrite ? null : { ip_session_key: key }), {
      status: writeFails ? 500 : 200, headers: { 'Content-Type': 'application/json' },
    });
  });
  const client = createClient('https://fake-project.supabase.co', 'public-test-key', { global: { fetch: transport }, auth: { persistSession: false } });
  return { transport, limiter: createChatLimiter(() => client) };
}

test('a healthy database reserves a request', async () => {
  const { limiter, transport } = setup();
  expect(await limiter.limit('127.0.0.1', 'session')).toBe('allowed');
  expect(transport).toHaveBeenCalledTimes(2);
});
test('a database read failure never grants access', async () => {
  expect(await setup(row, false, true).limiter.limit('127.0.0.1', 'session')).toBe('unavailable');
});
test.each([null, row, { ...row, window_start: '2000-01-01T00:00:00Z' }])('insert, increment or reset failures never grant access (%j)', async existing => {
  expect(await setup(existing, true).limiter.limit('127.0.0.1', 'session')).toBe('unavailable');
});
test.each([{ ...row, request_count: 30 }, { ...row, token_count: 100000 }])('normal quota exhaustion is limited, not an outage', async existing => {
  const { limiter, transport } = setup(existing);
  expect(await limiter.limit('127.0.0.1', 'session')).toBe('limited');
  expect(transport).toHaveBeenCalledTimes(1);
});
test('malformed quota records fail closed', async () => {
  expect(await setup({ ...row, request_count: 'bad' }).limiter.limit('ip', 'session')).toBe('unavailable');
});
test('missing configuration fails closed', async () => {
  const limiter = createChatLimiter(() => { throw new Error('missing config'); });
  expect(await limiter.limit('ip', 'session')).toBe('unavailable');
});
test('token accounting surfaces a failed write instead of detaching a promise', async () => {
  await expect(setup(row, true).limiter.account('ip', 'session', 2)).rejects.toThrow();
});

test('a disappeared quota row cannot silently grant access', async () => {
  expect(await setup(row, false, false, true).limiter.limit('ip', 'session')).toBe('unavailable');
});
