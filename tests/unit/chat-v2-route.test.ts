import { DefaultChatTransport, readUIMessageStream } from 'ai';
import { afterEach, expect, test, vi } from 'vitest';
import { createChatV2Route } from '../../lib/api/chat-v2-route';
import { createChatRoute, type ChatServices } from '../../lib/api/chat-route';
import { GenerationStartError, type UsageReport } from '../../lib/chat/contracts';

afterEach(() => vi.restoreAllMocks());
const usage: UsageReport = { attempts: [{ provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 }], termination: 'complete' };
const body = { sessionId: 'session', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: "  What's React/Vue？<中文> " }] }] };
const request = (value: unknown = body, options: RequestInit = {}) => new Request('https://www.plonguo.com/api/chat/v2', {
  method: 'POST', headers: { Origin: 'https://www.plonguo.com', 'Content-Type': 'application/json' }, body: JSON.stringify(value), ...options,
});
function setup() {
  const services: ChatServices = {
    verify: vi.fn(async () => true),
    admit: vi.fn<ChatServices['admit']>(async (ipKey, requestId) => ({ status: 'allowed', permit: { ipKey, requestId, windowId: 'window' } })),
    start: vi.fn(async () => ({ text: (async function* () { yield '第一'; yield ' second'; })(), outcome: Promise.resolve(usage) })),
    settle: vi.fn(async () => {}),
  };
  return { services, handle: createChatV2Route(services) };
}
test('v2 produces one SDK-readable assistant with safe headers and settles exactly once', async () => {
  const { services, handle } = setup();
  const response = await handle(request());
  expect(response.status).toBe(200);
  expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
  expect(response.headers.get('content-type')).toContain('text/event-stream');
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('vary')).toBe('Origin');
  expect(response.headers.get('access-control-allow-origin')).toBe('https://www.plonguo.com');
  const snapshots = [];
  const transport = new DefaultChatTransport({ fetch: async () => response });
  const stream = await transport.sendMessages({ chatId: 'sdk', messages: [], trigger: 'submit-message', messageId: undefined, abortSignal: undefined });
  for await (const message of readUIMessageStream({ stream, terminateOnError: true })) snapshots.push(message);
  expect(new Set(snapshots.map(item => item.id)).size).toBe(1);
  expect(snapshots.at(-1)).toMatchObject({ role: 'assistant', parts: [{ type: 'text', text: '第一 second' }] });
  expect(services.start).toHaveBeenCalledWith({ message: "  What's React/Vue？<中文> ", history: [] }, expect.any(AbortSignal));
  expect(services.settle).toHaveBeenCalledTimes(1);
  expect(services.settle).toHaveBeenCalledWith(expect.any(Object), usage);
});
test('finish is withheld until accounting completes', async () => {
  const { services, handle } = setup();
  let release!: () => void;
  services.settle = vi.fn(async () => new Promise<void>(resolve => { release = resolve; }));
  const reader = (await handle(request())).body!.getReader();
  let output = '';
  const consuming = (async () => { while (true) { const { done, value } = await reader.read(); if (done) break; output += new TextDecoder().decode(value); } })();
  await vi.waitFor(() => expect(services.settle).toHaveBeenCalledTimes(1));
  expect(output).not.toContain('"type":"finish"');
  release(); await consuming;
  expect(output.match(/"type":"start"/g)).toHaveLength(1);
  expect(output.match(/"type":"text-start"/g)).toHaveLength(1);
  expect(output.match(/"type":"finish"/g)).toHaveLength(1);
});
test.each(['model', 'accounting'] as const)('%s failure preserves partial text with a stable error code and no normal finish', async failure => {
  const { services, handle } = setup();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  if (failure === 'model') services.start = async () => ({ text: (async function* () { yield 'partial'; throw new Error('private provider secret'); })(), outcome: Promise.resolve({ ...usage, termination: 'error' }) });
  else services.settle = async () => { throw new Error('private accounting secret'); };
  const output = await (await handle(request())).text();
  expect(output).toContain('text-delta');
  expect(output).toContain('"type":"error","errorText":"generic"');
  expect(output).not.toContain('"type":"finish"');
  expect(output).not.toContain('private');
});
test('startup failure carries usage to settlement and returns safe JSON', async () => {
  const { services, handle } = setup();
  services.start = async () => { throw new GenerationStartError({ ...usage, termination: 'error' }); };
  const response = await handle(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({ code: 'SERVER_ERROR' });
  expect(services.settle).toHaveBeenCalledWith(expect.any(Object), { ...usage, termination: 'error' });
});
test('cancelling the SDK response aborts generation, retains accounting and never settles twice', async () => {
  const { services } = setup();
  let upstream!: AbortSignal;
  let retained!: Promise<void>;
  let release!: () => void;
  services.start = async (_body, signal) => { upstream = signal; return {
    text: (async function* () { yield 'first'; await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true })); })(),
    outcome: Promise.resolve({ ...usage, termination: 'aborted' }),
  }; };
  services.settle = vi.fn(async () => new Promise<void>(resolve => { release = resolve; }));
  const handle = createChatV2Route(services, completion => { retained = completion; });
  const reader = (await handle(request())).body!.getReader();
  await reader.read();
  const cancelled = reader.cancel();
  await vi.waitFor(() => expect(upstream.aborted).toBe(true));
  await vi.waitFor(() => expect(services.settle).toHaveBeenCalledTimes(1));
  let complete = false; void retained.then(() => { complete = true; });
  expect(complete).toBe(false);
  release(); await retained; await cancelled;
  expect(services.settle).toHaveBeenCalledWith(expect.any(Object), { ...usage, termination: 'aborted' });
});
test.each([
  [null, {}, 400], [body, { headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' } }, 403],
  [body, { headers: { Origin: 'https://www.plonguo.com', 'Content-Type': 'text/plain' } }, 415],
  [body, { body: '{' }, 400], [body, { body: JSON.stringify({ ...body, extra: '中'.repeat(11000) }) }, 413],
  [body, { method: 'GET', body: undefined }, 405],
] as const)('rejects HTTP boundary %# before admission and model', async (value, options, status) => {
  const { services, handle } = setup();
  expect((await handle(request(value, options))).status).toBe(status);
  expect(services.admit).not.toHaveBeenCalled(); expect(services.start).not.toHaveBeenCalled();
});
test('OPTIONS and token validation retain existing security policy', async () => {
  const { services, handle } = setup();
  const response = await handle(request(body, { method: 'OPTIONS', body: undefined }));
  expect(response.status).toBe(204); expect(response.headers.get('vary')).toBe('Origin');
  services.verify = vi.fn(async () => false);
  expect((await handle(request({ ...body, turnstileToken: 'invalid' }))).status).toBe(403);
  expect(services.admit).not.toHaveBeenCalled(); expect(services.start).not.toHaveBeenCalled();
});
test('body limit measures UTF-8 bytes at exactly 32768, independent of JS character count', async () => {
  const { services, handle } = setup();
  const base = JSON.stringify({ ...body, padding: '' });
  const remaining = 32768 - new TextEncoder().encode(base).length;
  const padding = '中'.repeat(Math.floor(remaining / 3)) + 'x'.repeat(remaining % 3);
  const valid = JSON.stringify({ ...body, padding });
  expect(new TextEncoder().encode(valid).length).toBe(32768);
  const response = await handle(request(body, { body: valid }));
  expect(response.status).toBe(200); await response.text();
  expect((await handle(request(body, { body: JSON.stringify({ ...body, padding: padding + 'x' }) }))).status).toBe(413);
  expect(services.start).toHaveBeenCalledTimes(1);
});
test('legacy and SDK routes share one IP quota, independent of client session or protocol', async () => {
  const { services } = setup();
  let count = 0;
  services.admit = vi.fn<ChatServices['admit']>(async (ipKey, requestId) => ++count > 30 ? { status: 'limited' } : { status: 'allowed', permit: { ipKey, requestId, windowId: 'window' } });
  const old = createChatRoute(services); const modern = createChatV2Route(services);
  for (let i = 0; i < 30; i++) {
    const response = await (i % 2 ? old(request({ message: 'hi', sessionId: `s${i}` })) : modern(request({ ...body, sessionId: `s${i}` })));
    expect(response.status).toBe(200); await response.text();
  }
  for (const [handle, value] of [[old, { message: 'hi', sessionId: 'new-old' }], [modern, { ...body, sessionId: 'new-v2' }]] as const) {
    const response = await handle(request(value)); expect(response.status).toBe(429); expect(await response.json()).toMatchObject({ code: 'RATE_LIMIT' });
  }
  expect(services.start).toHaveBeenCalledTimes(30); expect(services.settle).toHaveBeenCalledTimes(30);
  expect(new Set(vi.mocked(services.admit).mock.calls.map(call => call[0]))).toEqual(new Set(['unknown']));
});
