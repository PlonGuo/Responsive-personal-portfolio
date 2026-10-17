'use client';

import { useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, Send, AlertCircle, Bot, Square } from 'lucide-react';
import { useChatbot } from '../hooks/useChatbot';
import { formatMessageTime } from '../utils/chatbot-helpers';
import type { Message } from '../types/chat';

import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';
import { getErrorMessage } from '../../lib/i18n/errors';
import TurnstileWidget from './TurnstileWidget';
import ChatMarkdown from './ChatMarkdown';

// Loading dots animation
function LoadingDots({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <div role="status" aria-label={label} className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
          animate={reduced ? undefined : { y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Message bubble component
function MessageBubble({ message, locale }: { message: Message; locale: Locale }) {
  const reduced = useReducedMotion();
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`min-w-0 max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
        }`}
      >
        {isUser ? <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          : <ChatMarkdown content={message.content} />}
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {formatMessageTime(message.timestamp, locale === 'zh' ? 'zh-CN' : 'en-US')}
        </p>
      </div>
    </motion.div>
  );
}

// Welcome message
function WelcomeMessage({ copy }: { copy: Pick<Dictionary, 'chat'> }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8 px-4"
    >
      <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {copy.chat.welcome}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {copy.chat.welcomeBody}
      </p>
    </motion.div>
  );
}

export default function Chatbot({ locale, siteKey, copy }: {
  locale: Locale; siteKey: string; copy: Pick<Dictionary, 'chat' | 'a11y' | 'errors'>;
}) {
  const reduced = useReducedMotion();
  const {
    isOpen,
    messages,
    input,
    isLoading,
    needsVerification,
    turnstileToken,
    error,
    inputLength,
    maxInputLength,
    toggleChat,
    closeChat,
    setInput,
    sendMessage,
    setTurnstileToken,
    clearError,
    invalidateVerification,
    abortRequest,
  } = useChatbot();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
  }, [messages, reduced]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) launcherRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const timer = setTimeout(() => {
      if (!inputRef.current?.disabled) inputRef.current?.focus();
      else dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }, 0);
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const oldOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    return () => { clearTimeout(timer); if (mobile) document.body.style.overflow = oldOverflow; };
  }, [isOpen]);

  // Handle form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isLoading && input.trim()) {
      sendMessage();
    }
  };

  // Handle input keydown (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Candidate confirmation belongs to the input method, including its final 229 event.
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.shiftKey && !isLoading && input.trim()) {
        sendMessage();
      }
    }
  };

  return (
    <>
      {/* Toggle Button - Sci-Fi Design */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        {/* Outer rotating ring */}
        <div className="absolute inset-0 w-16 h-16 -m-1">
          <div className="w-full h-full rounded-full border-2 border-dashed border-cyan-400/40 animate-spin-slow" />
        </div>

        {/* Inner counter-rotating ring */}
        <div className="absolute inset-0 w-14 h-14">
          <div className="w-full h-full rounded-full border border-primary/30 animate-spin-slow-reverse" />
        </div>

        {/* Main button */}
        <motion.button
          ref={launcherRef}
          onClick={toggleChat}
          tabIndex={isOpen ? -1 : 0}
          aria-hidden={isOpen}
          className="relative w-14 h-14 rounded-full
            bg-gradient-to-br from-primary via-accent to-secondary
            text-white
            flex items-center justify-center
            animate-pulse-glow
            hover:scale-110
            transition-transform duration-200"
          whileTap={reduced ? undefined : { scale: 0.95 }}
          aria-label={copy.a11y.openChat}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

          {/* Icon */}
          <Bot className="w-7 h-7 relative z-10 drop-shadow-lg" />
        </motion.button>

        {/* Pulsing dot indicator */}
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"
          animate={reduced ? undefined : { scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed z-50
              inset-0 md:inset-auto
              md:bottom-6 md:right-6
              md:w-96 md:h-[600px] md:max-h-[80vh]
              flex flex-col
              bg-white/95 dark:bg-slate-800/95
              backdrop-blur-xl
              md:rounded-2xl
              border-0 md:border border-slate-200 dark:border-slate-700
              shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50
              overflow-hidden"
            ref={dialogRef}
            onKeyDown={(event) => {
              if (event.key !== 'Tab' || !window.matchMedia('(max-width: 767px)').matches) return;
              const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]') ?? []);
              const first = elements[0]; const last = elements.at(-1);
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }}
            role="dialog"
            aria-label={copy.a11y.chatDialog}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-slate-900 dark:text-white text-sm">
                    {copy.chat.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {copy.chat.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700
                  flex items-center justify-center transition-colors"
                aria-label={copy.a11y.closeChat}
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              role="log"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.length === 0 ? (
                <WelcomeMessage copy={copy} />
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} locale={locale} />
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (messages.at(-1)?.role !== 'assistant' || messages.at(-1)?.content === '') && (
                <div className="flex justify-start mb-3">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md">
                    <LoadingDots label={copy.chat.thinking} />
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Turnstile Verification */}
            {(needsVerification || turnstileToken) && (
              <motion.div
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800"
              >
                <p className="text-xs text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {needsVerification ? copy.chat.verify : copy.chat.verified}
                </p>
                <TurnstileWidget siteKey={siteKey} resetKey={0} action=""
                  onToken={setTurnstileToken} onDispose={invalidateVerification} />
              </motion.div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduced ? undefined : { opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
                >
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{getErrorMessage(error, copy)}</span>
                    <button
                      onClick={clearError}
                      aria-label={copy.a11y.close}
                      className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={needsVerification ? copy.chat.verifyPlaceholder : copy.chat.placeholder}
                    disabled={isLoading || needsVerification}
                    maxLength={maxInputLength}
                    className="w-full px-4 py-2.5 pr-12
                      bg-slate-100 dark:bg-slate-700
                      text-slate-900 dark:text-white
                      placeholder-slate-500 dark:placeholder-slate-400
                      rounded-xl border-0
                      focus:outline-none focus:ring-2 focus:ring-primary/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-sm"
                    aria-label={copy.a11y.chatInput}
                    aria-describedby="char-counter"
                  />
                  {/* Character counter */}
                  {inputLength > maxInputLength * 0.9 && (
                    <span
                      id="char-counter"
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs
                        ${inputLength >= maxInputLength ? 'text-red-500' : 'text-slate-400'}`}
                    >
                      {inputLength}/{maxInputLength}
                    </span>
                  )}
                </div>
                <button
                  type={isLoading ? 'button' : 'submit'}
                  onClick={isLoading ? abortRequest : undefined}
                  disabled={!isLoading && (!input.trim() || needsVerification)}
                  className="w-10 h-10 rounded-xl
                    bg-primary hover:bg-primary-dark
                    text-white
                    flex items-center justify-center
                    transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:hover:bg-primary"
                  aria-label={isLoading ? copy.a11y.stopChat : copy.a11y.sendChat}
                >
                  <>{isLoading ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}</>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
