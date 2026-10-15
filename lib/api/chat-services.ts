import 'server-only';
import OpenAI from 'openai';
import { getAdminClient } from '../supabase/admin';
import { buildSystemPrompt } from '../chat/system-prompt';
import { createChatLimiter } from './chat-rate-limit';
import type { ChatServices, ChatSubmission } from './chat-route';
import { verifyTurnstile } from '../../src/api/security';

const limiter = createChatLimiter(getAdminClient);
const sanitizeMessage = (message: string) => message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');

type StreamingParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
  thinking?: { type: 'disabled' };
};

async function* providerContent(apiKey: string, baseURL: string, params: StreamingParams,
  signal: AbortSignal, startupTimeout?: number): AsyncGenerator<string> {
  const cancellation = new AbortController();
  const upstreamSignal = AbortSignal.any([signal, cancellation.signal]);
  // Stop waiting for DeepSeek soon enough to leave time within the route's 20s deadline.
  const timer = startupTimeout === undefined ? undefined : setTimeout(() => cancellation.abort(), startupTimeout);
  try {
    upstreamSignal.throwIfAborted();
    const stream = await new OpenAI({ apiKey, baseURL, maxRetries: 0 })
      .chat.completions.create(params, { signal: upstreamSignal });
    for await (const chunk of stream) {
      upstreamSignal.throwIfAborted();
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        clearTimeout(timer);
        yield content;
      }
    }
    // The SDK ends silently for some aborts; callers still need a failure here.
    upstreamSignal.throwIfAborted();
  } finally {
    clearTimeout(timer);
    cancellation.abort();
  }
}

async function* contentWithFallback(body: ChatSubmission, signal: AbortSignal): AsyncGenerator<string> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...body.history.slice(-10).map(({ role, content }) => ({ role, content })),
    { role: 'user', content: sanitizeMessage(body.message) },
  ];
  let emitted = false;
  signal.throwIfAborted();
  if (deepseekKey) {
    try {
      for await (const content of providerContent(deepseekKey, 'https://api.deepseek.com', {
        model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash', messages,
        max_tokens: 1024, temperature: 0.7, stream: true, thinking: { type: 'disabled' },
      }, signal, 8_000)) {
        emitted = true;
        yield content;
      }
      if (emitted) return;
    } catch {
      signal.throwIfAborted();
      // Never join two providers' answers after any content has been delivered.
      if (emitted) throw new Error('Chat service unavailable');
    }
  }
  signal.throwIfAborted();
  if (!openaiKey) throw new Error('Chat service unavailable');
  try {
    for await (const content of providerContent(openaiKey, 'https://api.openai.com/v1', {
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini', messages,
      max_completion_tokens: 1024, stream: true,
    }, signal)) {
      emitted = true;
      yield content;
    }
    if (!emitted) throw new Error('Empty model response');
  } catch {
    throw new Error('Chat service unavailable');
  }
}

export const chatServices: ChatServices = {
  ...limiter,
  // The current chatbot widget sends no action; contact tokens carry 'contact'.
  verify: (token, ip, hostname) => verifyTurnstile(token, ip, { action: '', hostname }),
  async stream(body, signal) {
    const source = contentWithFallback(body, signal);
    // Fail before the HTTP/SSE response starts when neither provider can answer.
    const first = await source.next();
    return (async function* () {
      try {
        if (!first.done) yield first.value;
        yield* source;
      } finally { await source.return(undefined); }
    })();
  },
};
