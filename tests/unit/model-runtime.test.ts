import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createStartGeneration } from '../../lib/chat/model-runtime';
import { collect, transport, reply, failure, stalled, chunk, finish, data, encoder } from '../helpers/model-transport';
const input = { message: "What's React/Vue？<中文>", history: [] };
beforeEach(() => {
  vi.stubEnv('DEEPSEEK_API_KEY', 'deepseek-test-key'); vi.stubEnv('OPENAI_API_KEY', 'openai-test-key');
  vi.stubEnv('DEEPSEEK_MODEL', ''); vi.stubEnv('OPENAI_MODEL', '');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

test('real SDK transport sends original text, verified identity and isolated DeepSeek settings', async () => {
  const { fetcher, requests } = transport(() => reply());
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('reply');
  expect(await run.outcome).toEqual({ attempts: [{ provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 }], termination: 'complete' });
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ url: 'https://api.deepseek.com/chat/completions', authorization: 'Bearer deepseek-test-key',
    body: { model: 'deepseek-flash', max_tokens: 1024, temperature: 0.7, thinking: { type: 'disabled' }, stream_options: { include_usage: true } } });
  const messages = requests[0].body.messages as { role: string; content: string }[];
  expect(messages[0]).toMatchObject({ role: 'system', content: expect.stringContaining('过汇智融') });
  expect(messages.at(-1)).toEqual({ role: 'user', content: "What's React/Vue？<中文>" });
});
test.each([401, 429, 503])('HTTP %s starts OpenAI once with separate credentials and no DeepSeek options', async status => {
  vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.example');
  const { fetcher, requests } = transport((_request, i) => i ? reply('backup') : failure(status));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('backup');
  expect(requests.map(r => r.provider)).toEqual(['deepseek', 'openai']);
  expect(requests[1]).toMatchObject({ url: 'https://api.openai.com/v1/chat/completions', authorization: 'Bearer openai-test-key',
    body: { model: 'gpt-4.1-mini', max_completion_tokens: 1024 } });
  expect(requests[1].body).not.toHaveProperty('thinking'); expect(requests[1].body).not.toHaveProperty('max_tokens');
  expect((await run.outcome).attempts).toEqual([
    { provider: 'deepseek', inputTokens: null, outputTokens: null, totalTokens: null },
    { provider: 'openai', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
  ]);
});
test('a connection error has no hidden SDK retry before fallback', async () => {
  const { fetcher, requests } = transport((_r, i) => { if (!i) throw new TypeError('connection reset'); return reply('backup'); });
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('backup'); expect(requests).toHaveLength(2);
});
test('an empty primary can report known usage before fallback', async () => {
  const { fetcher, requests } = transport((_r, i) => i ? reply('backup') : reply(''));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('backup');
  expect((await run.outcome).attempts.map(a => a.totalTokens)).toEqual([30, 30]);
  expect(requests).toHaveLength(2);
});
test.each(['headers', 'metadata'])('DeepSeek stalled at %s is aborted at 8s before starting fallback', async stage => {
  vi.useFakeTimers();
  const { fetcher, requests } = transport((r, i) => {
    if (i) return reply('backup');
    if (stage === 'headers') return stalled(r);
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(encoder.encode(chunk('')));
      r.signal.addEventListener('abort', () => c.error(new DOMException('Aborted', 'AbortError')), { once: true });
    } }), { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const pending = createStartGeneration(fetcher)(input, new AbortController().signal);
  await vi.advanceTimersByTimeAsync(7999); expect(requests).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1);
  const run = await pending; expect(await collect(run.text)).toBe('backup');
  expect(requests).toHaveLength(2); expect(requests[0].signal.aborted).toBe(true);
});
test('first body content clears the 8s startup timeout', async () => {
  vi.useFakeTimers(); let writer!: ReadableStreamDefaultController<Uint8Array>;
  const { fetcher, requests } = transport(r => new Response(new ReadableStream({ start(c) {
    writer = c; c.enqueue(encoder.encode(chunk('first')));
    r.signal.addEventListener('abort', () => { try { c.error(r.signal.reason); } catch { /* Stream already closed. */ } }, { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  const consuming = collect(run.text);
  await vi.advanceTimersByTimeAsync(9000); expect(requests[0].signal.aborted).toBe(false);
  writer.enqueue(encoder.encode(chunk('second') + finish())); writer.close();
  expect(await consuming).toBe('firstsecond'); expect((await run.outcome).termination).toBe('complete');
});
test('failure after body content never joins a second provider', async () => {
  const { fetcher, requests } = transport(() => new Response(chunk('partial') + data({ error: { message: 'private failure' } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  const parts: string[] = [];
  await expect((async () => { for await (const part of run.text) parts.push(part); })()).rejects.toThrow('Chat service unavailable');
  expect(parts).toEqual(['partial']); expect(requests).toHaveLength(1); expect((await run.outcome).termination).toBe('error');
});
test('stopping a pending primary never calls fallback', async () => {
  const controller = new AbortController(); const { fetcher, requests } = transport(stalled);
  const pending = createStartGeneration(fetcher)(input, controller.signal);
  const rejected = expect(pending).rejects.toMatchObject({ report: { termination: 'aborted' } });
  await vi.waitFor(() => expect(requests).toHaveLength(1)); controller.abort(); await rejected;
  expect(requests).toHaveLength(1); expect(requests[0].signal.aborted).toBe(true);
});
test('both keys missing produces an empty-attempt startup error without a request', async () => {
  vi.stubEnv('DEEPSEEK_API_KEY', ''); vi.stubEnv('OPENAI_API_KEY', '');
  const { fetcher, requests } = transport(() => reply());
  await expect(createStartGeneration(fetcher)(input, new AbortController().signal)).rejects.toMatchObject({ report: { attempts: [], termination: 'error' } });
  expect(requests).toHaveLength(0);
});
test('configured model overrides are respected with fixed endpoints', async () => {
  vi.stubEnv('DEEPSEEK_MODEL', 'deepseek-v4-pro');
  const { fetcher, requests } = transport(() => reply());
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal); await collect(run.text);
  expect(requests[0].body.model).toBe('deepseek-v4-pro');
});

test('a primary stream error before text falls back without exposing its payload', async () => {
  const { fetcher, requests } = transport((_r, i) => i ? reply('backup') : new Response(data({ error: { message: 'private stream detail' } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('backup'); expect(requests).toHaveLength(2);
});
test('no fallback key means a failed primary stops after one attempt', async () => {
  vi.stubEnv('OPENAI_API_KEY', ''); const { fetcher, requests } = transport(() => failure());
  await expect(createStartGeneration(fetcher)(input, new AbortController().signal)).rejects.toMatchObject({ report: { attempts: [{ provider: 'deepseek', totalTokens: null }], termination: 'error' } });
  expect(requests).toHaveLength(1);
});
test('an empty fallback fails rather than producing an empty successful answer', async () => {
  const { fetcher, requests } = transport((_r, i) => i ? reply('') : failure());
  await expect(createStartGeneration(fetcher)(input, new AbortController().signal)).rejects.toMatchObject({ report: { termination: 'error' } });
  expect(requests).toHaveLength(2);
});
test('an expired parent deadline never starts a provider', async () => {
  const { fetcher, requests } = transport(() => reply());
  await expect(createStartGeneration(fetcher)(input, AbortSignal.abort())).rejects.toMatchObject({ report: { attempts: [], termination: 'aborted' } });
  expect(requests).toHaveLength(0);
});
test('overall deadline during pending fallback aborts it without a third attempt', async () => {
  vi.useFakeTimers(); const controller = new AbortController();
  const { fetcher, requests } = transport((r, i) => i ? stalled(r) : failure());
  const pending = createStartGeneration(fetcher)(input, controller.signal);
  const rejected = expect(pending).rejects.toMatchObject({ report: { termination: 'aborted' } });
  setTimeout(() => controller.abort(new DOMException('Deadline', 'TimeoutError')), 20000);
  await vi.advanceTimersByTimeAsync(19999); expect(requests).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(1); await rejected;
  expect(requests).toHaveLength(2); expect(requests[1].signal.aborted).toBe(true);
});
test('a transport that ends without a provider finish reason is interrupted after its partial text', async () => {
  const { fetcher, requests } = transport(() => new Response(chunk('partial'), { headers: { 'Content-Type': 'text/event-stream' } }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  await expect(collect(run.text)).rejects.toThrow('Chat service unavailable');
  expect((await run.outcome).termination).toBe('error'); expect(requests).toHaveLength(1);
});
