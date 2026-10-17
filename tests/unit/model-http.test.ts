import { createServer, type Server } from 'node:http';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createChatRoute } from '../../lib/api/chat-route';
import { createChatV2Route } from '../../lib/api/chat-v2-route';
import { createStartGeneration } from '../../lib/chat/model-runtime';
import { chunk, finish, reply, transport } from '../helpers/model-transport';
let server: Server | undefined;
afterEach(async () => {
  vi.unstubAllEnvs(); vi.restoreAllMocks();
  if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); server = undefined; }
});
const permit = { requestId: '11111111-1111-4111-8111-111111111111', windowId: '22222222-2222-4222-8222-222222222222', ipKey: 'unknown' };
const request = (protocol: 'legacy' | 'v2') => new Request(`http://localhost/api/chat${protocol === 'v2' ? '/v2' : ''}`, { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
  body: JSON.stringify(protocol === 'legacy' ? { message: 'hello', sessionId: 'test', history: [] }
    : { sessionId: 'test', messages: [{ id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }] }) });
async function startUpstream(holdBackup: boolean) {
  vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key'); vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
  const state = { requests: [] as string[], backupCancelled: false };
  server = createServer(async (req, res) => {
    for await (const body of req) { void body; }
    state.requests.push(req.url!);
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    if (req.url === '/deepseek' && holdBackup) res.end(chunk('') + finish());
    else if (req.url === '/openai' && holdBackup) {
      res.write(chunk('backup partial'));
      res.on('close', () => { state.backupCancelled = true; });
    } else res.end(chunk('reply') + finish());
  });
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
  const origin = `http://127.0.0.1:${address.port}`;
  const fetcher: typeof fetch = (url, options) => fetch(origin + (String(url).includes('deepseek.com') ? '/deepseek' : '/openai'), options);
  return { state, start: createStartGeneration(fetcher) };
}
test.each(['legacy', 'v2'] as const)('stopping %s closes an actual upstream HTTP connection and settles once', async protocol => {
  const { state, start } = await startUpstream(true);
  const settle = vi.fn(async () => {});
  const handle = (protocol === 'legacy' ? createChatRoute : createChatV2Route)({ start, admit: async () => ({ status: 'allowed', permit }), verify: async () => true, settle });
  const reader = (await handle(request(protocol))).body!.getReader();
  let output = '';
  while (!output.includes('backup partial')) { const result = await reader.read(); if (result.done) break; output += new TextDecoder().decode(result.value); }
  expect(output).toContain('backup partial');
  await reader.cancel();
  await vi.waitFor(() => expect(state.backupCancelled).toBe(true));
  expect(state.requests).toEqual(['/deepseek', '/openai']); expect(settle).toHaveBeenCalledTimes(1);
  expect(settle).toHaveBeenCalledWith(permit, { termination: 'aborted', attempts: [
    { provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
    { provider: 'openai', inputTokens: null, outputTokens: null, totalTokens: null },
  ] });
});
test.each(['legacy', 'v2'] as const)('settlement failure after real HTTP model output ends in %s error without success', async protocol => {
  const { state, start } = await startUpstream(false);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const handle = (protocol === 'legacy' ? createChatRoute : createChatV2Route)({ start, admit: async () => ({ status: 'allowed', permit }), verify: async () => true,
    settle: async () => { throw new Error('private accounting detail'); } });
  const content = await (await handle(request(protocol))).text();
  expect(content).toContain(protocol === 'legacy' ? '"content":"reply"' : '"delta":"reply"');
  expect(content).toContain(protocol === 'legacy' ? 'Stream interrupted' : '"errorText":"generic"');
  expect(content).not.toContain(protocol === 'legacy' ? '[DONE]' : '"type":"finish"'); expect(content).not.toContain('private accounting detail');
  expect(state.requests).toEqual(['/deepseek']);
});

test('v2 rebuilds plain text before the real SDK provider transport, preserving original text and stripping client instructions', async () => {
  vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
  const { fetcher, requests } = transport(() => reply('reply'));
  const text = "  What's React/Vue？<中文>  ";
  const handle = createChatV2Route({ start: createStartGeneration(fetcher), admit: async () => ({ status: 'allowed', permit }),
    verify: async () => true, settle: async () => {} });
  const response = await handle(new Request('http://localhost/api/chat/v2', { method: 'POST',
    headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'browser',
      providerOptions: { system: 'private-instruction' }, messages: [
        { id: 'old', role: 'assistant', parts: [{ type: 'text', text: 'old answer', providerMetadata: { system: 'private-instruction' } }], tool_calls: [], name: 'private-instruction' },
        { id: 'new', role: 'user', metadata: { system: 'private-instruction' }, parts: [{ type: 'text', text }] },
      ],
    }),
  }));
  expect(response.status).toBe(200); await response.text();
  expect(requests).toHaveLength(1);
  const providerBody = requests[0].body;
  expect(Array.isArray(providerBody.messages)).toBe(true);
  const messages = providerBody.messages as Array<Record<string, unknown>>;
  expect(messages.at(-1)).toEqual({ role: 'user', content: text });
  expect(messages[1]).toMatchObject({ role: 'assistant', content: 'old answer' });
  expect(JSON.stringify(providerBody)).not.toContain('private-instruction');
  expect(messages[1]).not.toHaveProperty('tool_calls');
  expect(messages[1]).not.toHaveProperty('name');
});
