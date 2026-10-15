import type { ChatState, Message } from '../../src/types/chat';
import { getUIErrorCode, type UIErrorCode } from '../i18n/errors';
import { getBrowserSession, type SessionState } from './session';
import type { Store } from './store';

class ChatFailure extends Error {
  constructor(public code: UIErrorCode) { super(code); }
}
export function createChatRuntime(store: Store<SessionState>, fetcher: typeof fetch = fetch) {
  let controller: AbortController | null = null;
  const update = (change: Partial<ChatState> | ((chat: ChatState) => ChatState)) => store.setState(previous => ({
    ...previous, chat: typeof change === 'function' ? change(previous.chat) : { ...previous.chat, ...change },
  }));
  return {
    async sendMessage() {
      const initial = store.getSnapshot().chat;
      const message = initial.input.trim();
      if (controller || initial.isLoading || !message || !initial.sessionId) return;
      if (message.length > 1000) { update({ error: 'validation' }); return; }
      if (initial.needsVerification && !initial.turnstileToken) { update({ error: 'verification' }); return; }
      const assistantId = crypto.randomUUID();
      const time = Date.now();
      const assistant: Message = { id: assistantId, role: 'assistant', content: '', timestamp: time };
      controller = new AbortController();
      const active = controller;
      update({ input: '', error: null, isLoading: true, turnstileToken: null,
        messages: [...initial.messages, { id: crypto.randomUUID(), role: 'user', content: message, timestamp: time }, assistant] });
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let complete = false;
      let output = '';
      const abortRead = () => { void reader?.cancel().catch(() => {}); };
      try {
        const response = await fetcher('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: active.signal,
          body: JSON.stringify({ message, sessionId: initial.sessionId,
            history: initial.messages.slice(-10).map(({ role, content }) => ({ role, content })),
            ...(initial.turnstileToken && { turnstileToken: initial.turnstileToken }),
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new ChatFailure(getUIErrorCode(response.status, body.code));
        }
        reader = response.body?.getReader();
        if (!reader) throw new ChatFailure('generic');
        active.signal.addEventListener('abort', abortRead, { once: true });
        if (active.signal.aborted) throw new DOMException('Stopped', 'AbortError');
        const decoder = new TextDecoder();
        let buffer = '';
        const consume = (line: string) => {
          if (!line.startsWith('data:')) return;
          const value = line.slice(5).trim();
          if (value === '[DONE]') { complete = true; return; }
          if (!value) return;
          const event: { content?: unknown; error?: unknown } = JSON.parse(value);
          if (event.error) throw new ChatFailure('generic');
          if (typeof event.content === 'string') {
            output += event.content;
            update(chat => ({ ...chat, messages: chat.messages.map(item => item.id === assistantId ? { ...item, content: output } : item) }));
          }
        };
        while (!complete && !active.signal.aborted) {
          const { done, value } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          let newline: number;
          while (!complete && (newline = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline).replace(/\r$/, '');
            buffer = buffer.slice(newline + 1);
            consume(line);
          }
          if (done) { if (buffer.trim() && !complete) consume(buffer.trim()); break; }
        }
        if (active.signal.aborted) throw new DOMException('Stopped', 'AbortError');
        if (!complete) throw new ChatFailure('generic');
        update(chat => {
          const count = chat.messageCount + 1;
          return { ...chat, messageCount: count, needsVerification: count % 10 === 0, error: null };
        });
      } catch (error) {
        const stopped = active.signal.aborted;
        if (!stopped) console.error('Chat request failed', error instanceof ChatFailure ? error.code : 'network or stream failure');
        const code = error instanceof ChatFailure ? error.code : 'generic';
        update(chat => ({ ...chat, error: stopped ? null : code,
          needsVerification: chat.needsVerification || Boolean(initial.turnstileToken) || code === 'verification',
          messages: output ? chat.messages : chat.messages.filter(item => item.id !== assistantId),
        }));
      } finally {
        active.signal.removeEventListener('abort', abortRead);
        await reader?.cancel().catch(() => {});
        reader?.releaseLock();
        if (controller === active) controller = null;
        update({ isLoading: false });
      }
    },
    abortRequest() { controller?.abort(); },
  };
}
let browserRuntime: ReturnType<typeof createChatRuntime> | undefined;
export function getChatRuntime() {
  return browserRuntime ??= createChatRuntime(getBrowserSession());
}
