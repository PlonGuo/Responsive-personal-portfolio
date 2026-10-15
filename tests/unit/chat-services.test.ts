import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { chatServices } from '../../lib/api/chat-services';
import { createChatRoute } from '../../lib/api/chat-route';

const body = { message: '<hello>', sessionId: 'test-session', history: [] };
const encoder = new TextEncoder();
const event = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
const reply = (content = 'reply') => new Response(`${event(content)}data: [DONE]\n\n`, {
  headers: { 'Content-Type': 'text/event-stream' },
});
const failure = (status = 503) => new Response(JSON.stringify({ error: { message: 'private provider error' } }), {
  status, headers: { 'Content-Type': 'application/json' },
});
async function collect(signal = new AbortController().signal) {
  const chunks: string[] = [];
  for await (const chunk of await chatServices.stream(body, signal)) chunks.push(chunk);
  return chunks;
}
interface ProviderRequest { url: string; authorization: string | null; body: Record<string, unknown>; signal: AbortSignal }
function transport(respond: (request: ProviderRequest, index: number) => Response | Promise<Response>) {
  const requests: ProviderRequest[] = [];
  vi.stubGlobal('fetch', async (url: unknown, options: RequestInit) => {
    const request = { url: String(url), authorization: new Headers(options.headers).get('authorization'),
      body: JSON.parse(String(options.body)), signal: options.signal! };
    requests.push(request);
    return respond(request, requests.length - 1);
  });
  return requests;
}
function stalled(request: ProviderRequest) {
  return new Promise<Response>((_resolve, reject) => {
    request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
}
beforeEach(() => {
  vi.stubEnv('DEEPSEEK_API_KEY', 'deepseek-test-key');
  vi.stubEnv('OPENAI_API_KEY', 'openai-test-key');
  vi.stubEnv('DEEPSEEK_MODEL', '');
  vi.stubEnv('OPENAI_MODEL', '');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('DeepSeek success sends sanitized history directly and never calls OpenAI', async () => {
  const requests = transport(() => reply());
  const history = [{ role: 'assistant' as const, content: 'older reply', name: 'untrusted-name', tool_calls: [] }];
  const source = await chatServices.stream({ ...body, history }, new AbortController().signal);
  const chunks: string[] = [];
  for await (const chunk of source) chunks.push(chunk);
  expect(chunks).toEqual(['reply']);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ url: 'https://api.deepseek.com/chat/completions', authorization: 'Bearer deepseek-test-key',
    body: { model: 'deepseek-flash', thinking: { type: 'disabled' }, stream: true } });
  expect((requests[0].body.messages as unknown[]).slice(1)).toEqual([
    { role: 'assistant', content: 'older reply' }, { role: 'user', content: '&lt;hello&gt;' },
  ]);
});

test('a configured DeepSeek model reaches the provider', async () => {
  vi.stubEnv('DEEPSEEK_MODEL', 'deepseek-v4-pro');
  const requests = transport(() => reply());
  expect(await collect()).toEqual(['reply']);
  expect(requests[0].body.model).toBe('deepseek-v4-pro');
});

test.each([401, 429, 503])('DeepSeek HTTP %s falls back once with isolated OpenAI credentials and parameters', async status => {
  vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.example/v1');
  const requests = transport((_request, index) => index === 0 ? failure(status) : reply('OpenAI reply'));
  expect(await collect()).toEqual(['OpenAI reply']);
  expect(requests).toHaveLength(2);
  expect(requests[1]).toMatchObject({ url: 'https://api.openai.com/v1/chat/completions', authorization: 'Bearer openai-test-key',
    body: { model: 'gpt-4.1-mini', max_completion_tokens: 1024, stream: true } });
  expect(requests[1].body).not.toHaveProperty('thinking');
  expect(requests[1].body).not.toHaveProperty('max_tokens');
  expect(requests[1].body.messages).toEqual(requests[0].body.messages);
});

test('connection failure falls back without retrying DeepSeek', async () => {
  const requests = transport((_request, index) => {
    if (index === 0) throw new TypeError('connection reset');
    return reply('backup');
  });
  expect(await collect()).toEqual(['backup']);
  expect(requests).toHaveLength(2);
});

test('missing DeepSeek key uses the configured OpenAI model directly', async () => {
  vi.stubEnv('DEEPSEEK_API_KEY', '');
  vi.stubEnv('OPENAI_MODEL', ' gpt-4.1 ');
  const requests = transport(() => reply('backup'));
  expect(await collect()).toEqual(['backup']);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ authorization: 'Bearer openai-test-key', body: { model: 'gpt-4.1' } });
});

test('no configured keys fails without issuing a network request', async () => {
  vi.stubEnv('DEEPSEEK_API_KEY', ''); vi.stubEnv('OPENAI_API_KEY', '');
  const requests = transport(() => reply());
  await expect(collect()).rejects.toThrow('Chat service unavailable');
  expect(requests).toHaveLength(0);
});

test('DeepSeek remains usable without a fallback key', async () => {
  vi.stubEnv('OPENAI_API_KEY', '');
  const requests = transport(() => reply());
  expect(await collect()).toEqual(['reply']);
  expect(requests).toHaveLength(1);
});

test('primary failure without a fallback key fails safely with no extra request', async () => {
  vi.stubEnv('OPENAI_API_KEY', '');
  const requests = transport(() => failure());
  await expect(collect()).rejects.toThrow('Chat service unavailable');
  expect(requests).toHaveLength(1);
});

test.each(['empty', 'stream-error'])('DeepSeek %s before content falls back', async mode => {
  const requests = transport((_request, index) => index ? reply('backup') : new Response(
    mode === 'empty' ? 'data: [DONE]\n\n' : 'data: {"error":{"message":"upstream failed"}}\n\n',
    { headers: { 'Content-Type': 'text/event-stream' } },
  ));
  expect(await collect()).toEqual(['backup']);
  expect(requests).toHaveLength(2);
});

test('both providers failing returns one generic API failure with no repeated attempts', async () => {
  const requests = transport(() => failure());
  const account = vi.fn(async () => {});
  const handle = createChatRoute({ ...chatServices, limit: async () => 'allowed', account });
  const response = await handle(new Request('https://plonguo.com/api/chat', { method: 'POST',
    headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ code: 'SERVER_ERROR', error: 'Something went wrong. Please try again.' });
  expect(requests).toHaveLength(2);
  expect(account).not.toHaveBeenCalled();
});

test('failure after emitted content never splices in a second provider', async () => {
  const requests = transport(() => new Response(`${event('partial')}data: {"error":{"message":"lost connection"}}\n\n`,
    { headers: { 'Content-Type': 'text/event-stream' } }));
  const chunks: string[] = [];
  await expect((async () => { for await (const chunk of await chatServices.stream(body, new AbortController().signal)) chunks.push(chunk); })())
    .rejects.toThrow();
  expect(chunks).toEqual(['partial']);
  expect(requests).toHaveLength(1);
});

test.each(['headers', 'first-content'])('DeepSeek stalled at %s is aborted after 8 seconds and OpenAI takes over', async stage => {
  vi.useFakeTimers();
  const requests = transport((request, index) => {
    if (index) return reply('backup');
    if (stage === 'headers') return stalled(request);
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(encoder.encode(event('')));
      request.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
    } }), { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const result = collect();
  await vi.advanceTimersByTimeAsync(7999);
  expect(requests).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(await result).toEqual(['backup']);
  expect(requests).toHaveLength(2);
  expect(requests[0].signal.aborted).toBe(true);
});

test('primary startup timer stops after first content so long replies continue', async () => {
  vi.useFakeTimers();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const requests = transport(request => new Response(new ReadableStream({ start(next) {
    controller = next; next.enqueue(encoder.encode(event('first')));
    request.signal.addEventListener('abort', () => next.error(new DOMException('Aborted', 'AbortError')), { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const source = await chatServices.stream(body, new AbortController().signal);
  const iterator = source[Symbol.asyncIterator]();
  expect((await iterator.next()).value).toBe('first');
  await vi.advanceTimersByTimeAsync(9000);
  expect(requests[0].signal.aborted).toBe(false);
  controller.enqueue(encoder.encode(`${event('second')}data: [DONE]\n\n`)); controller.close();
  expect((await iterator.next()).value).toBe('second');
  expect((await iterator.next()).done).toBe(true);
  expect(requests).toHaveLength(1);
});

test('cancelling a pending primary call aborts it without starting OpenAI', async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const requests = transport(stalled);
  const result = collect(controller.signal);
  const rejection = expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(1);
  controller.abort();
  await rejection;
  expect(requests).toHaveLength(1);
  expect(requests[0].signal.aborted).toBe(true);
});

test('an expired overall deadline never starts either provider', async () => {
  const controller = new AbortController(); controller.abort();
  const requests = transport(() => reply());
  await expect(collect(controller.signal)).rejects.toThrow();
  expect(requests).toHaveLength(0);
});

test('successful fallback preserves SSE content/DONE and accounts only emitted backup chunks', async () => {
  const requests = transport((_request, index) => index ? reply('backup') : failure());
  const account = vi.fn(async () => {});
  const handle = createChatRoute({ ...chatServices, limit: async () => 'allowed', account });
  const response = await handle(new Request('https://plonguo.com/api/chat', { method: 'POST',
    headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('data: {"content":"backup"}\n\ndata: [DONE]\n\n');
  expect(account).toHaveBeenCalledWith('unknown', 'test-session', 1);
  expect(requests).toHaveLength(2);
});

test('a Supabase limiter outage still blocks both model providers', async () => {
  const requests = transport(() => reply());
  const handle = createChatRoute({ ...chatServices, limit: async () => 'unavailable' });
  const response = await handle(new Request('https://plonguo.com/api/chat', { method: 'POST',
    headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  expect(response.status).toBe(503);
  expect(requests).toHaveLength(0);
});

test('empty fallback is an error rather than a successful empty reply', async () => {
  const requests = transport((_request, index) => index ? reply('') : failure());
  await expect(collect()).rejects.toThrow('Chat service unavailable');
  expect(requests).toHaveLength(2);
});

test('stopping consumption after first content cancels the upstream without fallback', async () => {
  const requests = transport(() => reply());
  const source = await chatServices.stream(body, new AbortController().signal);
  for await (const chunk of source) { expect(chunk).toBe('reply'); break; }
  expect(requests).toHaveLength(1);
  expect(requests[0].signal.aborted).toBe(true);
});

test('overall cancellation during pending OpenAI fallback cancels its request without retry', async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const requests = transport((request, index) => index ? stalled(request) : failure());
  const result = collect(controller.signal);
  const rejection = expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(1);
  expect(requests).toHaveLength(2);
  controller.abort();
  await rejection;
  expect(requests[1].signal.aborted).toBe(true);
  expect(requests).toHaveLength(2);
});

test('cancelling after OpenAI content aborts upstream and accounts only its emitted chunk', async () => {
  const requests = transport((request, index) => index === 0 ? failure() : new Response(new ReadableStream({ start(controller) {
    controller.enqueue(encoder.encode(event('backup partial')));
    request.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const account = vi.fn(async () => {});
  const controller = new AbortController();
  const handle = createChatRoute({ ...chatServices, limit: async () => 'allowed', account });
  const response = await handle(new Request('https://plonguo.com/api/chat', { method: 'POST', signal: controller.signal,
    headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  const reader = response.body!.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toBe('data: {"content":"backup partial"}\n\n');
  controller.abort();
  expect(new TextDecoder().decode((await reader.read()).value)).toBe('data: {"error":"Stream interrupted"}\n\n');
  expect((await reader.read()).done).toBe(true);
  expect(requests).toHaveLength(2);
  expect(requests[1].signal.aborted).toBe(true);
  expect(account).toHaveBeenCalledWith('unknown', 'test-session', 1);
});
