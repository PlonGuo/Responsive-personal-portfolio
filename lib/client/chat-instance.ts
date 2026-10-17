import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type UIMessageChunk } from 'ai';
import type { ChatState, Message } from '../../src/types/chat';
import { getUIErrorCode, type UIErrorCode } from '../i18n/errors';
import { getBrowserSession, type SessionState } from './session';
import type { Store } from './store';

class ChatFailure extends Error {
  constructor(public readonly code: UIErrorCode) { super(code); }
}
const streamErrorCodes = new Set<UIErrorCode>(['generic', 'rateLimit', 'verification', 'validation']);
export function chatErrorCode(error: Error | undefined): UIErrorCode | null {
  if (!error) return null;
  if (error instanceof ChatFailure) return error.code;
  // The UI protocol carries stable codes, never provider prose or stack traces.
  return streamErrorCodes.has(error.message as UIErrorCode) ? error.message as UIErrorCode : 'generic';
}

class ChatTransport extends DefaultChatTransport<UIMessage> {
  protected processResponseStream(body: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
    let terminated = false;
    // The SDK decodes/validates SSE. This guard only distinguishes a settled
    // finish/error from a clean TCP EOF that lost the end of the response.
    return super.processResponseStream(body).pipeThrough(new TransformStream({
      transform(chunk, controller) {
        if (chunk.type === 'finish' || chunk.type === 'error' || chunk.type === 'abort') terminated = true;
        controller.enqueue(chunk);
      },
      flush() { if (!terminated) throw new ChatFailure('generic'); },
    }));
  }
}

export function createChatInstance(store: Store<SessionState>, fetcher: typeof fetch = (...args) => fetch(...args)) {
  const update = (change: Partial<ChatState> | ((chat: ChatState) => ChatState)) => store.setState(previous => ({
    ...previous, chat: typeof change === 'function' ? change(previous.chat) : { ...previous.chat, ...change },
  }));
  const timestamps = new Map<string, number>();
  let sending = false;
  let usedToken = false;
  const chat: Chat<UIMessage> = new Chat<UIMessage>({
    generateId: () => crypto.randomUUID(),
    transport: new ChatTransport({
      api: '/api/chat/v2',
      fetch: async (url, options) => {
        const response = await fetcher(url, options);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new ChatFailure(getUIErrorCode(response.status, body?.code));
        }
        return response;
      },
      prepareSendMessagesRequest: ({ messages, body, trigger }) => ({ body: {
        ...body, trigger,
        messages: messages.slice(-11).map(({ id, role, parts }) => ({ id, role,
          parts: parts.filter(part => part.type === 'text').map(part => ({ type: 'text', text: part.text })),
        })),
      } }),
    }),
    onFinish({ isAbort, isDisconnect, isError, finishReason }) {
      if (!isAbort && !isDisconnect && !isError && finishReason !== undefined) {
        update(state => {
          const count = state.messageCount + 1;
          return { ...state, messageCount: count, needsVerification: count % 10 === 0, localError: null };
        });
      } else {
        const verification = chatErrorCode(chat.error) === 'verification';
        update(state => ({ ...state, needsVerification: state.needsVerification || usedToken || verification }));
        // Stop/errors retain meaningful partial replies, not empty bubbles.
        chat.messages = chat.messages.filter(message => message.role !== 'assistant'
          || message.parts.some(part => part.type === 'text' && part.text.length > 0));
      }
    },
  });
  return {
    chat,
    projectMessages(messages: UIMessage[]): Message[] {
      return messages.filter(message => message.role === 'user' || message.role === 'assistant').map(message => {
        if (!timestamps.has(message.id)) timestamps.set(message.id, Date.now());
        return { id: message.id, role: message.role as Message['role'], timestamp: timestamps.get(message.id)!,
          content: message.parts.map(part => part.type === 'text' ? part.text : '').join('') };
      });
    },
    async sendMessage() {
      const initial = store.getSnapshot().chat;
      const message = initial.input;
      if (sending || chat.status === 'submitted' || chat.status === 'streaming' || !message.trim() || !initial.sessionId) return;
      if (message.length > 1000) { update({ localError: 'validation' }); return; }
      if (initial.needsVerification && !initial.turnstileToken) { update({ localError: 'verification' }); return; }
      sending = true;
      usedToken = Boolean(initial.turnstileToken);
      chat.clearError();
      update({ input: '', turnstileToken: null, localError: null });
      try {
        // Read at send time, before consuming the single-use token. No stale
        // React callback or mount-specific closure owns request credentials.
        await chat.sendMessage({ role: 'user', parts: [{ type: 'text', text: message }] }, { body: {
          sessionId: initial.sessionId, ...(initial.turnstileToken && { turnstileToken: initial.turnstileToken }),
        } });
      } finally { sending = false; usedToken = false; }
    },
    abortRequest: () => chat.stop(),
  };
}

let browserInstance: ReturnType<typeof createChatInstance> | undefined;
export function getChatInstance() {
  if (typeof window === 'undefined') throw new Error('Chat instances are browser-only');
  return browserInstance ??= createChatInstance(getBrowserSession());
}
