import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createStartGeneration } from '../../lib/chat/model-runtime';
import { collect, transport, reply, failure, chunk, encoder } from '../helpers/model-transport';
const input = { message: 'hello', history: [] };
beforeEach(() => { vi.stubEnv('DEEPSEEK_API_KEY', 'deepseek-test-key'); vi.stubEnv('OPENAI_API_KEY', 'openai-test-key'); });
afterEach(() => { vi.unstubAllEnvs(); });
test.each([
  [{ prompt_tokens: 23, completion_tokens: 7, total_tokens: 40 }, { inputTokens: 23, outputTokens: 7, totalTokens: 40 }],
  [{ prompt_tokens: 23, completion_tokens: 7 }, { inputTokens: 23, outputTokens: 7, totalTokens: 30 }],
  [{ prompt_tokens: 23 }, { inputTokens: 23, outputTokens: null, totalTokens: null }],
  [null, { inputTokens: null, outputTokens: null, totalTokens: null }],
  [{ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, { inputTokens: 0, outputTokens: 0, totalTokens: 0 }],
])('preserves real usage and distinguishes missing fields from zero: %j', async (usage, expected) => {
  const { fetcher } = transport(() => reply('reply', usage));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  await collect(run.text);
  expect(await run.outcome).toEqual({ attempts: [{ provider: 'deepseek', ...expected }], termination: 'complete' });
});
test('SDK parsing errors do not write a non-numeric provider token count as success', async () => {
  const { fetcher } = transport(() => reply('partial', { prompt_tokens: '23', completion_tokens: 7 }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  await expect(collect(run.text)).rejects.toThrow();
  expect(await run.outcome).toEqual({ attempts: [{ provider: 'deepseek', inputTokens: null, outputTokens: null, totalTokens: null }], termination: 'error' });
});
test('no primary key uses configured fallback without inventing a primary attempt', async () => {
  vi.stubEnv('DEEPSEEK_API_KEY', ''); vi.stubEnv('OPENAI_MODEL', ' gpt-4.1 ');
  const { fetcher, requests } = transport(() => reply('backup'));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('backup');
  expect((await run.outcome).attempts).toEqual([{ provider: 'openai', inputTokens: 23, outputTokens: 7, totalTokens: 30 }]);
  expect(requests[0].body.model).toBe('gpt-4.1');
});
test('DeepSeek works with no fallback key', async () => {
  vi.stubEnv('OPENAI_API_KEY', ''); const { fetcher, requests } = transport(() => reply());
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  expect(await collect(run.text)).toBe('reply'); expect(requests).toHaveLength(1);
});
test('startup errors carry both failed attempts instead of losing accounting', async () => {
  const { fetcher, requests } = transport(() => failure());
  await expect(createStartGeneration(fetcher)(input, new AbortController().signal)).rejects.toMatchObject({ report: {
    attempts: [{ provider: 'deepseek', totalTokens: null }, { provider: 'openai', totalTokens: null }], termination: 'error',
  } });
  expect(requests).toHaveLength(2);
});
test('cancelling a reply after fallback content aborts upstream and resolves unknown usage', async () => {
  const controller = new AbortController();
  const { fetcher, requests } = transport((r, i) => i ? new Response(new ReadableStream({ start(c) {
    c.enqueue(encoder.encode(chunk('partial backup')));
    r.signal.addEventListener('abort', () => { try { c.error(r.signal.reason); } catch { /* Stream already closed. */ } }, { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }) : failure());
  const run = await createStartGeneration(fetcher)(input, controller.signal);
  const iterator = run.text[Symbol.asyncIterator](); expect((await iterator.next()).value).toBe('partial backup');
  controller.abort();
  expect((await run.outcome).termination).toBe('aborted');
  expect((await run.outcome).attempts).toEqual([
    { provider: 'deepseek', inputTokens: null, outputTokens: null, totalTokens: null },
    { provider: 'openai', inputTokens: null, outputTokens: null, totalTokens: null },
  ]);
  await iterator.return?.();
  expect(requests).toHaveLength(2); expect(requests[1].signal.aborted).toBe(true);
});
test('ending text consumption explicitly stops the model instead of draining it for usage', async () => {
  const { fetcher, requests } = transport(r => new Response(new ReadableStream({ start(c) {
    c.enqueue(encoder.encode(chunk('first')));
    r.signal.addEventListener('abort', () => { try { c.error(r.signal.reason); } catch { /* Stream already closed. */ } }, { once: true });
  } }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const run = await createStartGeneration(fetcher)(input, new AbortController().signal);
  for await (const text of run.text) { expect(text).toBe('first'); break; }
  expect(requests).toHaveLength(1); expect(requests[0].signal.aborted).toBe(true);
  expect((await run.outcome).termination).toBe('aborted');
});
