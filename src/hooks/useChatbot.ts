import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message, ChatState } from '../types/chat';
import { generateSessionId } from '../utils/chatbot-helpers';

const VERIFICATION_INTERVAL = 10; // Require verification every 10 messages
const MAX_INPUT_LENGTH = 1000;

export function useChatbot() {
  const [state, setState] = useState<ChatState>(() => ({
    messages: [],
    isOpen: false,
    isLoading: false,
    input: '',
    sessionId: generateSessionId(),
    messageCount: 0,
    turnstileToken: null,
    needsVerification: false,
    error: null,
  }));

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen, error: null }));
  }, []);

  // Close chat window
  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Update input with max length enforcement
  const setInput = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input: input.slice(0, MAX_INPUT_LENGTH) }));
  }, []);

  // Set Turnstile token after verification
  const setTurnstileToken = useCallback((token: string | null) => {
    setState((prev) => ({
      ...prev,
      turnstileToken: token,
      needsVerification: token ? false : prev.needsVerification,
      error: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    const { input, messages, sessionId, turnstileToken, needsVerification, isLoading } = state;

    // Prevent sending while loading
    if (isLoading) return;

    // Validate input
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Check verification requirement
    if (needsVerification && !turnstileToken) {
      setState((prev) => ({
        ...prev,
        error: 'Please complete the verification to continue chatting.',
      }));
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    // Create placeholder AI message
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Update state with user message and placeholder
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, aiMessage],
      input: '',
      isLoading: true,
      error: null,
    }));

    // Prepare API request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare history (last 10 messages for context)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId,
          history,
          turnstileToken,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                streamedContent += parsed.content;

                // Update AI message content progressively
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: streamedContent }
                      : msg
                  ),
                }));
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              // Ignore JSON parse errors for incomplete chunks
              if (data !== '[DONE]' && data.trim()) {
                console.debug('Parse error for chunk:', data);
              }
            }
          }
        }
      }

      // Update state after successful response
      setState((prev) => {
        const newCount = prev.messageCount + 1;
        const needsNewVerification = newCount % VERIFICATION_INTERVAL === 0;

        return {
          ...prev,
          isLoading: false,
          messageCount: newCount,
          needsVerification: needsNewVerification,
          turnstileToken: needsNewVerification ? null : prev.turnstileToken,
        };
      });
    } catch (error: unknown) {
      // Handle abort (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== aiMessageId),
          isLoading: false,
        }));
        return;
      }

      console.error('Send message error:', error);

      // Remove placeholder AI message and show error
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((msg) => msg.id !== aiMessageId),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
      }));
    }
  }, [state]);

  // Abort ongoing request
  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Handle keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, closeChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRequest();
    };
  }, [abortRequest]);

  return {
    // State
    ...state,
    messagesEndRef,
    inputLength: state.input.length,
    maxInputLength: MAX_INPUT_LENGTH,

    // Actions
    toggleChat,
    closeChat,
    setInput,
    sendMessage,
    setTurnstileToken,
    clearError,
    abortRequest,
  };
}
