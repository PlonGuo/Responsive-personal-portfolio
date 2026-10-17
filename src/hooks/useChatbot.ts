'use client';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useChat } from '@ai-sdk/react';
import type { ChatState } from '../types/chat';
import { useSession } from './useSession';
import { getBrowserSession } from '../../lib/client/session';
import { getChatRuntime } from '../../lib/client/chat-runtime';
import { chatErrorCode, getChatInstance } from '../../lib/client/chat-instance';

function update(change: Partial<ChatState> | ((chat: ChatState) => ChatState)) {
  getBrowserSession().setState(previous => ({ ...previous,
    chat: typeof change === 'function' ? change(previous.chat) : { ...previous.chat, ...change },
  }));
}
const closeChat = () => update({ isOpen: false });
const setInput = (input: string) => update({ input: input.slice(0, 1000) });
const setTurnstileToken = (token: string | null) => {
  getChatInstance().chat.clearError();
  update(chat => ({ ...chat, turnstileToken: token,
    needsVerification: token ? false : chat.needsVerification || Boolean(chat.turnstileToken), localError: null,
  }));
};
const invalidateVerification = () => update(chat => chat.turnstileToken
  ? { ...chat, turnstileToken: null, needsVerification: true } : chat);
const clearError = () => { update({ localError: null }); getChatInstance().chat.clearError(); };
const toggleChat = () => { clearError(); update(chat => ({ ...chat, isOpen: !chat.isOpen })); };
const sendMessage = () => getChatRuntime().sendMessage();
const abortRequest = () => getChatRuntime().abortRequest();
const subscribeHydration = () => () => {};

export function useChatbot() {
  const chat = useSession('chat');
  // Server and hydration renders use an isolated empty SDK chat. The live
  // singleton is only read after hydration, so browser history cannot enter SSR.
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const instance = hydrated ? getChatInstance() : undefined;
  const sdk = useChat(instance ? { chat: instance.chat } : { id: 'server-empty-chat' });
  const messages = useMemo(() => instance?.projectMessages(sdk.messages) ?? [], [instance, sdk.messages]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && chat.isOpen) closeChat(); };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [chat.isOpen]);
  return { ...chat, messages, isLoading: sdk.status === 'submitted' || sdk.status === 'streaming',
    error: chat.localError ?? chatErrorCode(sdk.error), messagesEndRef, inputLength: chat.input.length, maxInputLength: 1000,
    toggleChat, closeChat, setInput, sendMessage, setTurnstileToken, invalidateVerification, clearError, abortRequest };
}
