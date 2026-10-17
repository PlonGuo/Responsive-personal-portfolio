import { getClientIp, isAllowedOrigin } from '../../src/api/security';
import { GenerationStartError, type ChatQuota, type Generation, type StartGeneration, type UsageReport } from '../chat/contracts';
import { errorResponse, JsonBodyError, readJson, requestHeaders } from './http';

import type { NormalizedChatInput } from './chat-input';
export interface ChatServices extends ChatQuota {
  verify(token: string, ip: string, hostname: string): Promise<boolean>;
  start: StartGeneration;
}

export interface ChatProtocol<T> {
  parse(value: unknown): NormalizedChatInput | null;
  events(): { start: T[]; delta(text: string): T; success: T[]; failure: T };
  respond(stream: ReadableStream<T>, headers: Record<string, string>): Response;
}

// Bound awaited work even when a dependency ignores cancellation. The dependency
// still receives the same signal so its real transport can stop upstream work.
function waitFor<T>(work: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => { cleanup(); reject(signal.reason); };
    const cleanup = () => signal.removeEventListener('abort', aborted);
    Promise.resolve(work).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    if (signal.aborted) aborted();
    else signal.addEventListener('abort', aborted, { once: true });
  });
}

export function createChatHandler<T>(services: ChatServices, protocol: ChatProtocol<T>, retainCompletion?: (completion: Promise<void>) => void) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') ?? undefined;
    const headers: Record<string, string> = { Vary: 'Origin', 'Cache-Control': 'no-store' };
    const fail = (status: number, code: string, error: string) => errorResponse(status, code, error, headers);
    const unavailable = () => fail(503, 'SERVER_ERROR', 'Service temporarily unavailable');
    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      headers.Allow = 'POST, OPTIONS';
      return fail(405, 'VALIDATION', 'Method not allowed');
    }
    if (!isAllowedOrigin(origin)) return fail(403, 'VALIDATION', 'Forbidden');
    headers['Access-Control-Allow-Origin'] = origin!;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      return new Response(null, { status: 204, headers });
    }
    const cancellation = new AbortController();
    const signal = AbortSignal.any([request.signal, cancellation.signal, AbortSignal.timeout(20_000)]);
    if (signal.aborted) return unavailable();
    let body: NormalizedChatInput | null;
    try { body = protocol.parse(await waitFor(readJson(request), signal)); }
    catch (error) { return signal.aborted ? unavailable() : fail(error instanceof JsonBodyError ? error.status : 400, 'VALIDATION', 'Invalid request body'); }
    if (!body) return fail(400, 'VALIDATION', 'Invalid message, session or history');
    const ip = getClientIp(requestHeaders(request));
    try {
      if (body.turnstileToken && !await waitFor(services.verify(body.turnstileToken, ip, new URL(origin!).hostname), signal)) {
        return fail(403, 'VERIFICATION_FAILED', 'Verification failed. Please try again.');
      }
    } catch { return signal.aborted ? unavailable() : fail(403, 'VERIFICATION_FAILED', 'Verification failed. Please try again.'); }
    if (signal.aborted) return unavailable();
    let admission;
    try { admission = await services.admit(ip, crypto.randomUUID(), signal); }
    catch { return unavailable(); }
    if (admission.status !== 'allowed') return admission.status === 'limited'
      ? fail(429, 'RATE_LIMIT', 'Rate limit exceeded. Please try again later.') : unavailable();
    const permit = admission.permit;
    let finish!: () => void;
    const completion = new Promise<void>(resolve => { finish = resolve; });
    retainCompletion?.(completion);
    let settlement: Promise<boolean> | undefined;
    const settle = (report: UsageReport, phase: 'startup' | 'stream') => settlement ??= (async () => {
      try {
        await services.settle(permit, report);
        return true;
      } catch {
        console.error({ event: 'chat_settlement_failed', requestId: permit.requestId, phase });
        return false;
      } finally { finish(); }
    })();
    let generation: Generation;
    try {
      signal.throwIfAborted();
      // The owned runtime terminates on this signal and carries usage in its
      // startup error. Racing it here would discard that report on cancellation.
      generation = await services.start({ message: body.message, history: body.history }, signal);
    } catch (error) {
      const report: UsageReport = error instanceof GenerationStartError ? error.report
        : { attempts: [], termination: signal.aborted ? 'aborted' : 'error' };
      cancellation.abort();
      await settle(report, 'startup');
      return fail(500, 'SERVER_ERROR', 'Something went wrong. Please try again.');
    }
    const events = protocol.events();
    let closed = false;
    const stream = new ReadableStream<T>({
      async start(controller) {
        const send = (event: T) => { if (!closed) controller.enqueue(event); };
        events.start.forEach(send);
        let interrupted = false;
        let iterator: AsyncIterator<string> | undefined;
        try {
          iterator = generation.text[Symbol.asyncIterator]();
          while (!signal.aborted) {
            const item = await waitFor(iterator.next(), signal);
            if (signal.aborted || item.done) break;
            if (item.value) send(events.delta(item.value));
          }
        } catch { interrupted = true; }
        finally {
          const termination = signal.aborted ? 'aborted' : interrupted ? 'error' : 'complete';
          cancellation.abort();
          // Do not wait forever for an iterator that ignores abort. The real
          // provider transport has already received cancellation above.
          try { void Promise.resolve(iterator?.return?.()).catch(() => {}); } catch { /* Already failed. */ }
          const outcome = await generation.outcome;
          const report: UsageReport = { ...outcome, termination: termination === 'complete' ? outcome.termination : termination };
          const accounted = await settle(report, 'stream');
          if (!closed) {
            if (!accounted || report.termination !== 'complete') send(events.failure);
            else events.success.forEach(send);
            closed = true;
            controller.close();
          }
        }
      },
      async cancel() { closed = true; cancellation.abort(); await completion; },
    });
    return protocol.respond(stream, headers);
  };
}
