import { expect, test, vi } from 'vitest';
import { createStore } from '../../lib/client/store';
import { createSessionState } from '../../lib/client/session';
import { createChatRuntime } from '../../lib/client/chat-runtime';
import { chatErrorCode, createChatInstance } from '../../lib/client/chat-instance';
import { uiStart, uiDelta, uiFinish, uiEvents, uiReply } from '../helpers/ui-stream';

function setup() {
  let writer!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; } });
  const fetcher = vi.fn<typeof fetch>(async () => new Response(body));
  const store = createStore(createSessionState('same-session'));
  store.setState(previous => ({ ...previous, chat: { ...previous.chat, input: 'hello' } }));
  const instance = createChatInstance(store, fetcher);
  return { writer, fetcher, store, instance, runtime: createChatRuntime(instance) };
}
const encoder = new TextEncoder();

test('a delayed SSE survives detachment and a second subscriber without another fetch', async () => {
  const { writer, fetcher, store, instance, runtime } = setup();
  const detach = store.subscribe(() => {});
  const pending = runtime.sendMessage();
  writer.enqueue(encoder.encode(uiEvents([...uiStart, uiDelta('第一段')])));
  await vi.waitFor(() => expect(instance.projectMessages(instance.chat.messages).at(-1)?.content).toBe('第一段'));
  detach();
  await runtime.sendMessage();
  writer.enqueue(encoder.encode(uiEvents([uiDelta(' second'), ...uiFinish])));
  writer.close();
  await pending;
  const detachAgain = store.subscribe(() => {});
  expect(instance.projectMessages(instance.chat.messages).at(-1)?.content).toBe('第一段 second');
  expect(store.getSnapshot().chat.sessionId).toBe('same-session');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
  expect(['submitted', 'streaming'].includes(instance.chat.status)).toBe(false);
  detachAgain();
});
test('parses JSON lines and multibyte text split at every possible byte boundary', async () => {
  const { writer, store, instance, runtime } = setup();
  const pending = runtime.sendMessage();
  for (const byte of encoder.encode(uiReply('中文🙂').replaceAll('\n', '\r\n'))) writer.enqueue(new Uint8Array([byte]));
  writer.close();
  await pending;
  expect(instance.projectMessages(instance.chat.messages).at(-1)?.content).toBe('中文🙂');
  expect(store.getSnapshot().chat.messageCount).toBe(1);
});
test.each([uiEvents([...uiStart, uiDelta('partial'), { type: 'error', errorText: 'generic' }]), uiEvents([...uiStart, uiDelta('partial')])])('SSE errors and premature EOF remain failures, retaining partial text', async events => {
  const { writer, store, instance, runtime } = setup();
  const pending = runtime.sendMessage();
  writer.enqueue(encoder.encode(events)); writer.close(); await pending;
  expect(chatErrorCode(instance.chat.error)).toBe('generic');
  expect(store.getSnapshot().chat.messageCount).toBe(0);
  expect(instance.projectMessages(instance.chat.messages).at(-1)?.content).toBe('partial');
});
test('explicit stop aborts the request and releases loading without reporting success', async () => {
  const { fetcher, store, instance, runtime } = setup();
  const pending = runtime.sendMessage();
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());
  runtime.abortRequest();
  await pending;
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(['submitted', 'streaming'].includes(instance.chat.status)).toBe(false);
  expect(store.getSnapshot().chat.messageCount).toBe(0);
});
test('verification counters and single-use tokens survive view changes', async () => {
  const store = createStore(createSessionState('same-id'));
  store.setState(previous => ({ ...previous, chat: { ...previous.chat, input: 'hi', messageCount: 9 } }));
  const fetcher = vi.fn<typeof fetch>(async () => new Response(uiReply('ok')));
  const instance = createChatInstance(store, fetcher);
  const runtime = createChatRuntime(instance);
  await runtime.sendMessage();
  expect(store.getSnapshot().chat.needsVerification).toBe(true);
  store.setState(previous => ({ ...previous, chat: { ...previous.chat, input: 'another' } }));
  await runtime.sendMessage();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().chat.localError).toBe('verification');
});
