'use client';
import { useEffect, useRef } from 'react';
import type { ChatState } from '../types/chat';
import { useSession } from './useSession';
import { getBrowserSession } from '../../lib/client/session';
import { getChatRuntime } from '../../lib/client/chat-runtime';

function update(change: Partial<ChatState> | ((chat: ChatState) => ChatState)) {
  getBrowserSession().setState(previous => ({ ...previous,
    chat: typeof change === 'function' ? change(previous.chat) : { ...previous.chat, ...change },
  }));
}
const closeChat = () => update({ isOpen: false });
const setInput = (input: string) => update({ input: input.slice(0, 1000) });
const setTurnstileToken = (token: string | null) => update(chat => ({ ...chat, turnstileToken: token,
  needsVerification: token ? false : chat.needsVerification || Boolean(chat.turnstileToken), error: null,
}));
const invalidateVerification = () => update(chat => chat.turnstileToken
  ? { ...chat, turnstileToken: null, needsVerification: true } : chat);
const clearError = () => update({ error: null });
const toggleChat = () => update(chat => ({ ...chat, isOpen: !chat.isOpen, error: null }));
const sendMessage = () => getChatRuntime().sendMessage();
const abortRequest = () => getChatRuntime().abortRequest();

export function useChatbot() {
  const chat = useSession('chat');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && chat.isOpen) closeChat(); };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [chat.isOpen]);
  return { ...chat, messagesEndRef, inputLength: chat.input.length, maxInputLength: 1000,
    toggleChat, closeChat, setInput, sendMessage, setTurnstileToken, invalidateVerification, clearError, abortRequest };
}
