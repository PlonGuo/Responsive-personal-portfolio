// @vitest-environment jsdom
import { useChat } from '@ai-sdk/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { createChatInstance, getChatInstance, chatErrorCode } from '../../lib/client/chat-instance';
import { createStore } from '../../lib/client/store';
import { createSessionState, getBrowserSession } from '../../lib/client/session';
import { useChatbot } from '../../src/hooks/useChatbot';
import { delayedUIResponse, uiStart, uiDelta, uiFinish, uiReply } from '../helpers/ui-stream';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const draft = (store: ReturnType<typeof createStore<ReturnType<typeof createSessionState>>>, input: string) => store.setState(s => ({ ...s, chat: { ...s.chat, input } }));
function setup() {
  const stream = delayedUIResponse();
  const fetcher = vi.fn<typeof fetch>(async () => stream.response);
  const store = createStore(createSessionState('same-session'));
  const instance = createChatInstance(store, fetcher);
  draft(store, '  question 中文  ');
  return { stream, fetcher, store, instance };
}
function Consumer({ instance, label }: { instance: ReturnType<typeof createChatInstance>; label: string }) {
  const chat = useChat({ chat: instance.chat });
  return <div data-testid={label}>{chat.messages.flatMap(message => message.parts.map(part => part.type === 'text' ? part.text : '')).join('|')}:{chat.status}</div>;
}
test('two real useChat consumers detach independently; stream and timestamps survive remount without another HTTP request', async () => {
  const { stream, fetcher, store, instance } = setup();
  const first = render(<Consumer instance={instance} label="first" />);
  const second = render(<Consumer instance={instance} label="second" />);
  let sending!: Promise<void>;
  await act(async () => { sending = instance.sendMessage(); stream.send([...uiStart, uiDelta('first')]); });
  expect(screen.getByTestId('first').textContent).toContain('first');
  const timestamp = instance.projectMessages(instance.chat.messages).at(-1)?.timestamp;
  first.unmount();
  await act(async () => { stream.send([uiDelta(' second')]); });
  expect(screen.getByTestId('second').textContent).toContain('first second');
  second.unmount();
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);
  await instance.sendMessage();
  await act(async () => { stream.send(uiFinish); stream.close(); await sending; });
  render(<Consumer instance={instance} label="third" />);
  expect(screen.getByTestId('third').textContent).toContain('first second:ready');
  expect(instance.projectMessages(instance.chat.messages).at(-1)?.timestamp).toBe(timestamp);
  expect(store.getSnapshot().chat.messageCount).toBe(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toMatchObject({ sessionId: 'same-session', messages: [
    { role: 'user', parts: [{ type: 'text', text: '  question 中文  ' }] },
  ] });
});
test('browser singleton is stable, while injected stores have isolated SDK history', async () => {
  expect(getChatInstance()).toBe(getChatInstance());
  const a = setup(); const b = setup();
  const sending = a.instance.sendMessage(); a.stream.send([...uiStart, uiDelta('private A'), ...uiFinish]); a.stream.close(); await sending;
  expect(b.instance.chat.messages).toEqual([]);
  expect(b.store.getSnapshot().chat.messageCount).toBe(0);
});
test('server rendering never reads the browser transcript or creates a shared server chat', () => {
  const instance = getChatInstance();
  instance.chat.messages = [{ id: 'private', role: 'user', parts: [{ type: 'text', text: 'private-browser-history' }] }];
  getBrowserSession().setState(s => ({ ...s, chat: { ...s.chat, input: 'private-draft', isOpen: true } }));
  function View() { const chat = useChatbot(); return <div>{chat.input}{chat.messages.map(m => m.content)}{chat.sessionId}</div>; }
  expect(renderToString(<View />)).toBe('<div></div>');
  instance.chat.messages = [];
});
test('transport selects the latest ten history messages, current text once, and fresh per-send token/session', async () => {
  const { instance, store } = setup();
  const fetcher = vi.fn<typeof fetch>(async () => new Response(uiReply('answer')));
  const fresh = createChatInstance(store, fetcher);
  fresh.chat.messages = Array.from({ length: 15 }, (_, i) => ({ id: `old-${i}`, role: i % 2 ? 'assistant' as const : 'user' as const, parts: [{ type: 'text', text: `history ${i}` }] }));
  store.setState(s => ({ ...s, chat: { ...s.chat, sessionId: 'new-session', turnstileToken: 'fresh-token' } }));
  await fresh.sendMessage();
  const sent = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  expect(sent.sessionId).toBe('new-session'); expect(sent.turnstileToken).toBe('fresh-token');
  expect(sent.messages).toHaveLength(11); expect(sent.messages[0].id).toBe('old-5');
  expect(sent.messages.filter((m: { parts: { text: string }[] }) => m.parts[0].text === '  question 中文  ')).toHaveLength(1);
  expect(store.getSnapshot().chat.turnstileToken).toBeNull(); expect(store.getSnapshot().chat.input).toBe('');
  expect(instance.chat.messages).toEqual([]);
});
test.each([false, true])('explicit stop cancels the body, preserving only nonempty assistant text (partial=%s)', async partial => {
  const { stream, fetcher, store, instance } = setup();
  const pending = instance.sendMessage(); stream.send([...uiStart, ...(partial ? [uiDelta('partial')] : [])]);
  await vi.waitFor(() => expect(instance.chat.messages.at(-1)?.role).toBe('assistant'));
  await instance.abortRequest(); await pending;
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  await vi.waitFor(() => expect(stream.cancelled).toBe(true));
  expect(instance.chat.error).toBeUndefined(); expect(instance.chat.status).toBe('ready');
  expect(instance.chat.messages.filter(m => m.role === 'assistant')).toHaveLength(partial ? 1 : 0);
  expect(store.getSnapshot().chat.messageCount).toBe(0);
});
test.each(['error', 'eof'] as const)('%s retains partial text, never counts success or retries, and next submission inserts only one new user', async mode => {
  const { stream, fetcher, store, instance } = setup();
  const sending = instance.sendMessage();
  stream.send([...uiStart, uiDelta('partial'), ...(mode === 'error' ? [{ type: 'error' as const, errorText: 'generic' }] : [])]); stream.close();
  await sending;
  expect(chatErrorCode(instance.chat.error)).toBe('generic'); expect(instance.projectMessages(instance.chat.messages).at(-1)?.content).toBe('partial');
  expect(store.getSnapshot().chat.messageCount).toBe(0); expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockResolvedValueOnce(new Response(uiReply('new answer')));
  draft(store, 'second question'); await instance.sendMessage();
  expect(instance.chat.messages.filter(m => m.role === 'user')).toHaveLength(2);
  expect(store.getSnapshot().chat.messageCount).toBe(1);
});
test.each([[429, 'RATE_LIMIT', 'rateLimit'], [403, 'VERIFICATION_FAILED', 'verification'], [400, 'VALIDATION', 'validation'], [503, 'SERVER_ERROR', 'generic']] as const)('HTTP %s maps safe API codes without exposing details', async (status, code, expected) => {
  const { fetcher, store, instance } = setup();
  fetcher.mockResolvedValueOnce(Response.json({ code, error: 'private secret' }, { status }));
  store.setState(s => ({ ...s, chat: { ...s.chat, turnstileToken: 'consumed' } }));
  await instance.sendMessage();
  expect(chatErrorCode(instance.chat.error)).toBe(expected); expect(instance.chat.error?.message).not.toContain('private');
  expect(store.getSnapshot().chat.needsVerification).toBe(true); expect(store.getSnapshot().chat.messageCount).toBe(0);
});
test('every tenth successful completion gates verification, invalid input does not create SDK messages', async () => {
  const { fetcher, store, instance } = setup();
  fetcher.mockResolvedValueOnce(new Response(uiReply('ok')));
  store.setState(s => ({ ...s, chat: { ...s.chat, messageCount: 9 } }));
  await instance.sendMessage(); expect(store.getSnapshot().chat.needsVerification).toBe(true);
  draft(store, 'next'); await instance.sendMessage();
  expect(store.getSnapshot().chat.localError).toBe('verification'); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(instance.chat.messages).toHaveLength(2);
  const other = setup(); draft(other.store, 'x'.repeat(1001)); await other.instance.sendMessage();
  expect(other.store.getSnapshot().chat.localError).toBe('validation'); expect(other.instance.chat.messages).toEqual([]);
});
