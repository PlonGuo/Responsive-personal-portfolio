import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { chatServices } from '../../lib/api/chat-services';
import { createChatRoute } from '../../lib/api/chat-route';
import { collect, transport, reply, failure } from '../helpers/model-transport';
const input = { message: "What's React/Vue？<中文>", sessionId: 'test-session', history: [] };
beforeEach(() => {
  vi.stubEnv('DEEPSEEK_API_KEY', 'deepseek-test-key'); vi.stubEnv('OPENAI_API_KEY', 'openai-test-key');
  vi.stubEnv('DEEPSEEK_MODEL', ''); vi.stubEnv('OPENAI_MODEL', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const makeRequest = () => new Request('https://plonguo.com/api/chat', { method: 'POST',
  headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
const admission = async (ipKey: string, requestId: string) => ({ status: 'allowed' as const,
  permit: { ipKey, requestId, windowId: '22222222-2222-4222-8222-222222222222' } });

test.each(['deepseek', 'fallback'] as const)('the %s production service receives verified Chinese identity and strips extra history fields', async mode => {
  const { fetcher, requests } = transport((_request, i) => mode === 'fallback' && !i ? failure() : reply());
  vi.stubGlobal('fetch', fetcher);
  const history = [{ role: 'assistant' as const, content: '我叫郭汇智。', name: 'untrusted', tool_calls: [] }];
  const run = await chatServices.start({ ...input, history }, new AbortController().signal);
  expect(await collect(run.text)).toBe('reply');
  for (const request of requests) {
    const messages = request.body.messages as { role: string; content: string }[];
    expect(messages[0]).toMatchObject({ role: 'system', content: expect.stringContaining('Chinese full name: 过汇智融') });
    expect(messages[0].content).toContain('Chinese surname: 过; given name: 汇智融');
    expect(messages[1]).toMatchObject({ role: 'assistant', content: '我叫郭汇智。' });
    expect(messages[1]).not.toHaveProperty('name');
    expect(messages[1]).not.toHaveProperty('tool_calls');
    expect(messages.at(-1)).toEqual({ role: 'user', content: "What's React/Vue？<中文>" });
  }
});
test('successful fallback preserves old SSE and settles both attempts with the real known total', async () => {
  const { fetcher, requests } = transport((_request, i) => i ? reply('backup') : reply(''));
  vi.stubGlobal('fetch', fetcher);
  const settle = vi.fn(async () => {});
  const handle = createChatRoute({ ...chatServices, admit: admission, settle });
  const response = await handle(makeRequest());
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('data: {"content":"backup"}\n\ndata: [DONE]\n\n');
  expect(settle).toHaveBeenCalledWith(expect.any(Object), { attempts: [
    { provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
    { provider: 'openai', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
  ], termination: 'complete' });
  expect(requests).toHaveLength(2);
});
test('both providers failing still settles startup attempts with no private error response', async () => {
  const { fetcher, requests } = transport(() => failure()); vi.stubGlobal('fetch', fetcher);
  const settle = vi.fn(async () => {});
  const response = await createChatRoute({ ...chatServices, admit: admission, settle })(makeRequest());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ code: 'SERVER_ERROR', error: 'Something went wrong. Please try again.' });
  expect(requests).toHaveLength(2);
  expect(settle).toHaveBeenCalledWith(expect.any(Object), { attempts: [
    { provider: 'deepseek', inputTokens: null, outputTokens: null, totalTokens: null },
    { provider: 'openai', inputTokens: null, outputTokens: null, totalTokens: null },
  ], termination: 'error' });
});
test('quota outage blocks both real SDK provider transports', async () => {
  const { fetcher, requests } = transport(() => reply()); vi.stubGlobal('fetch', fetcher);
  const handle = createChatRoute({ ...chatServices, admit: async () => ({ status: 'unavailable' }) });
  expect((await handle(makeRequest())).status).toBe(503); expect(requests).toHaveLength(0);
});

test('route cancellation after fallback text settles once, cancels upstream and retains known primary usage', async () => {
  const { encoder, chunk } = await import('../helpers/model-transport');
  const { fetcher, requests } = transport((r, i) => i ? new Response(new ReadableStream({ start(c) {
    c.enqueue(encoder.encode(chunk('backup partial')));
    r.signal.addEventListener('abort', () => { try { c.error(r.signal.reason); } catch { /* Stream already closed. */ } }, { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }) : reply(''));
  vi.stubGlobal('fetch', fetcher);
  const settle = vi.fn(async () => {});
  const reader = (await createChatRoute({ ...chatServices, admit: admission, settle })(makeRequest())).body!.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toContain('backup partial');
  await reader.cancel();
  expect(settle).toHaveBeenCalledTimes(1);
  expect(settle).toHaveBeenCalledWith(expect.any(Object), { attempts: [
    { provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
    { provider: 'openai', inputTokens: null, outputTokens: null, totalTokens: null },
  ], termination: 'aborted' });
  expect(requests[1].signal.aborted).toBe(true); expect(requests).toHaveLength(2);
});
test('real SDK usage cannot produce DONE when quota settlement fails', async () => {
  const { fetcher } = transport(() => reply()); vi.stubGlobal('fetch', fetcher);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await createChatRoute({ ...chatServices, admit: admission, settle: async () => { throw new Error('private database detail'); } })(makeRequest());
    const content = await response.text(); expect(content).toContain('"content":"reply"');
    expect(content).toContain('Stream interrupted'); expect(content).not.toContain('[DONE]');
    expect(content).not.toContain('private database detail');
  } finally { log.mockRestore(); }
});
