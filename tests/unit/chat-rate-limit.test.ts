import { createClient } from '@supabase/supabase-js';
import { afterEach, expect, test, vi } from 'vitest';
import { createChatLimiter } from '../../lib/api/chat-rate-limit';

const requestId = '11111111-1111-4111-8111-111111111111';
const windowId = '22222222-2222-4222-8222-222222222222';
const permit = { requestId, ipKey: '127.0.0.1', windowId };
const known = { attempts: [{ provider: 'deepseek' as const, inputTokens: 30, outputTokens: 7, totalTokens: 37 }], termination: 'complete' as const };
function setup(data: unknown = [{ status: 'allowed', window_id: windowId }], status = 200) {
  const transport = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  }));
  const client = createClient('https://fake-project.supabase.co', 'public-test-key', { global: { fetch: transport }, auth: { persistSession: false } });
  return { transport, limiter: createChatLimiter(() => client) };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

test('reserves an IP request in a single RPC without a session-controlled key', async () => {
  const { limiter, transport } = setup();
  expect(await limiter.admit(permit.ipKey, requestId)).toEqual({ status: 'allowed', permit });
  expect(transport).toHaveBeenCalledTimes(1);
  expect(String(transport.mock.calls[0][0])).toContain('/rpc/admit_chat_request');
  expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({ p_ip_key: '127.0.0.1', p_request_id: requestId });
});
test('quota exhaustion is limited instead of an outage', async () => {
  expect(await setup([{ status: 'limited', window_id: null }]).limiter.admit(permit.ipKey, requestId)).toEqual({ status: 'limited' });
});
test.each([null, [], [{ status: 'allowed', window_id: 'bad' }], [{ status: 'unexpected', window_id: windowId }],
  [{ status: 'allowed', window_id: windowId }, { status: 'allowed', window_id: windowId }]])('malformed admission fails closed: %j', async data => {
  expect(await setup(data).limiter.admit(permit.ipKey, requestId)).toEqual({ status: 'unavailable' });
});
test('RPC failure never grants admission', async () => {
  expect(await setup({ message: 'private database failure' }, 503).limiter.admit(permit.ipKey, requestId)).toEqual({ status: 'unavailable' });
});
test('missing configuration fails closed', async () => {
  expect(await createChatLimiter(() => { throw new Error('missing'); }).admit(permit.ipKey, requestId)).toEqual({ status: 'unavailable' });
});
test.each([['', requestId], ['x'.repeat(201), requestId], ['ip', 'bad']])('invalid identity is rejected before the database', async (ip, id) => {
  const { limiter, transport } = setup();
  expect(await limiter.admit(ip, id)).toEqual({ status: 'unavailable' });
  expect(transport).not.toHaveBeenCalled();
});
test('admission RPC times out after five seconds', async () => {
  vi.useFakeTimers();
  // Native AbortSignal.timeout is outside Vitest's fake clock. Preserve its
  // abort semantics while driving the deadline through the test clock.
  vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  });
  const transport = vi.fn<typeof fetch>((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const client = createClient('https://fake-project.supabase.co', 'test-key', { global: { fetch: transport }, auth: { persistSession: false } });
  const result = createChatLimiter(() => client).admit(permit.ipKey, requestId);
  await vi.advanceTimersByTimeAsync(5000);
  expect(await result).toEqual({ status: 'unavailable' });
});
test.each(['settled', 'already_settled'])('settlement %s uses one RPC with request identity and real usage', async result => {
  const { limiter, transport } = setup(result);
  await limiter.settle(permit, known);
  expect(transport).toHaveBeenCalledTimes(1);
  expect(String(transport.mock.calls[0][0])).toContain('/rpc/settle_chat_usage');
  expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({ p_request_id: requestId, p_report: known });
});
test('unknown usage stays null rather than becoming chunk count or zero', async () => {
  const { limiter, transport } = setup('settled');
  await limiter.settle(permit, { attempts: [{ provider: 'legacy', inputTokens: null, outputTokens: null, totalTokens: null }], termination: 'aborted' });
  expect(JSON.parse(String(transport.mock.calls[0][1]?.body)).p_report.attempts[0].totalTokens).toBeNull();
});
test.each([null, 'wrong', { message: 'private' }])('malformed settlement response is surfaced: %j', async data => {
  await expect(setup(data).limiter.settle(permit, known)).rejects.toThrow('Chat usage settlement unavailable');
});
test('a failed settlement write cannot silently succeed', async () => {
  await expect(setup({ message: 'conflict' }, 409).limiter.settle(permit, known)).rejects.toThrow('Chat usage settlement unavailable');
});
test('invalid token numbers never reach RPC', async () => {
  const { limiter, transport } = setup('settled');
  await expect(limiter.settle(permit, { ...known, attempts: [{ ...known.attempts[0], totalTokens: -1 }] })).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});

test('a caller cancellation stops admission instead of outliving the route deadline', async () => {
  const controller = new AbortController();
  let upstream!: AbortSignal;
  const transport: typeof fetch = async (_url, options) => {
    upstream = options!.signal!;
    return new Promise((_resolve, reject) => upstream.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  };
  const client = createClient('https://fake-project.supabase.co', 'test-key', { global: { fetch: transport }, auth: { persistSession: false } });
  const result = createChatLimiter(() => client).admit(permit.ipKey, requestId, controller.signal);
  await vi.waitFor(() => expect(upstream).toBeDefined());
  controller.abort();
  expect(await result).toEqual({ status: 'unavailable' });
  expect(upstream.aborted).toBe(true);
});
test('an already aborted admission never touches the database', async () => {
  const { limiter, transport } = setup();
  expect(await limiter.admit(permit.ipKey, requestId, AbortSignal.abort())).toEqual({ status: 'unavailable' });
  expect(transport).not.toHaveBeenCalled();
});
