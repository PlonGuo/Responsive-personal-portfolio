import 'server-only';
import { streamText, type TextStreamPart, type ToolSet } from 'ai';
import { getChatProviders } from './providers';
import { buildSystemPrompt } from './system-prompt';
import { GenerationStartError, type AttemptUsage, type StartGeneration, type UsageReport } from './contracts';

function readUsage(attempt: AttemptUsage, raw: Record<string, unknown> | undefined) {
  // Providers may default missing usage fields to zero. Only their raw numeric
  // counts are evidence; SDK-derived totals can also omit provider overhead.
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  attempt.inputTokens = count(raw?.prompt_tokens);
  attempt.outputTokens = count(raw?.completion_tokens);
  attempt.totalTokens = count(raw?.total_tokens);
  if (attempt.totalTokens === null && attempt.inputTokens !== null && attempt.outputTokens !== null) {
    const sum = attempt.inputTokens + attempt.outputTokens;
    if (Number.isSafeInteger(sum)) attempt.totalTokens = sum;
  }
}

export function createStartGeneration(fetcher: typeof fetch = (...args) => fetch(...args)): StartGeneration {
  return async (input, signal) => {
    const cancellation = new AbortController();
    const sharedSignal = AbortSignal.any([signal, cancellation.signal]);
    const attempts: AttemptUsage[] = [];
    let resolveOutcome!: (report: UsageReport) => void;
    const outcome = new Promise<UsageReport>(resolve => { resolveOutcome = resolve; });
    let report: UsageReport | undefined;
    const finish = (termination: UsageReport['termination']) => {
      if (!report) {
        report = { termination, attempts: attempts.map(attempt => ({ ...attempt })) };
        signal.removeEventListener('abort', abort);
        resolveOutcome(report);
      }
      return report;
    };
    const abort = () => { finish('aborted'); cancellation.abort(); };
    signal.addEventListener('abort', abort, { once: true });
    let emitted = false;
    async function* produce(): AsyncGenerator<string> {
      try {
        for (const provider of getChatProviders(fetcher)) {
          sharedSignal.throwIfAborted();
          const attempt: AttemptUsage = { provider: provider.name, inputTokens: null, outputTokens: null, totalTokens: null };
          attempts.push(attempt);
          const providerCancellation = new AbortController();
          const providerSignal = AbortSignal.any([sharedSignal, providerCancellation.signal]);
          let timer: ReturnType<typeof setTimeout> | undefined = provider.name === 'deepseek'
            ? setTimeout(() => providerCancellation.abort(), 8000) : undefined;
          let reader: ReadableStreamDefaultReader<TextStreamPart<ToolSet>> | undefined;
          let providerComplete = false;
          try {
            const { name: _name, ...options } = provider;
            void _name;
            const result = streamText({ ...options,
              system: buildSystemPrompt(input.message),
              messages: [...input.history.slice(-10).map(({ role, content }) => ({ role, content })), { role: 'user', content: input.message }],
              abortSignal: providerSignal, maxRetries: 0,
              onError: () => {}, // Stream errors are handled below; never log provider payloads.
            });
            // Accessing result.totalUsage would auto-consume the stream. Read
            // usage events from the one owned reader instead, preserving stop.
            reader = result.stream.getReader();
            while (true) {
              const { done, value: part } = await reader.read();
              providerSignal.throwIfAborted();
              if (done) break;
              if (part.type === 'text-delta' && part.text) {
                clearTimeout(timer); timer = undefined; emitted = true; yield part.text;
              } else if (part.type === 'finish-step') {
                readUsage(attempt, part.usage.raw);
                if (part.finishReason !== 'stop' && part.finishReason !== 'length') {
                  throw new Error('Chat service unavailable');
                }
              } else if (part.type === 'finish') {
                providerComplete = true;
              } else if (part.type === 'error' || part.type === 'abort') {
                throw new Error('Chat service unavailable');
              }
            }
            if (emitted && providerComplete) { finish('complete'); return; }
            if (emitted) throw new Error('Chat service unavailable');
          } catch {
            sharedSignal.throwIfAborted();
            if (emitted) throw new Error('Chat service unavailable');
          } finally {
            clearTimeout(timer); providerCancellation.abort();
            // SDK cancellation releases reads; don't wait for a stalled body cancel.
            void reader?.cancel().catch(() => {});
            try { reader?.releaseLock(); } catch { /* A pending read will release on abort. */ }
          }
        }
        throw new Error('Chat service unavailable');
      } finally {
        finish(sharedSignal.aborted ? 'aborted' : 'error');
      }
    }
    const source = produce();
    try {
      sharedSignal.throwIfAborted();
      const first = await source.next();
      if (first.done) throw new Error('Chat service unavailable');
      return {
        outcome,
        text: (async function* () {
          try { yield first.value; yield* source; }
          finally {
            if (!report) finish('aborted');
            cancellation.abort();
            void source.return(undefined).catch(() => {});
          }
        })(),
      };
    } catch {
      const final = finish(sharedSignal.aborted ? 'aborted' : 'error');
      cancellation.abort();
      throw new GenerationStartError(final);
    }
  };
}
export const startGeneration = createStartGeneration();
