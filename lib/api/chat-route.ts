import { getClientIp, isAllowedOrigin } from '../../src/api/security';
import { errorResponse, JsonBodyError, readJson, requestHeaders } from './http';

export type ChatLimit = 'allowed' | 'limited' | 'unavailable';
export interface ChatSubmission {
  message: string;
  sessionId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  turnstileToken?: string;
}
export interface ChatServices {
  limit(ip: string, sessionId: string): Promise<ChatLimit>;
  verify(token: string, ip: string, hostname: string): Promise<boolean>;
  stream(body: ChatSubmission, signal: AbortSignal): AsyncIterable<string> | Promise<AsyncIterable<string>>;
  account(ip: string, sessionId: string, chunks: number): Promise<void>;
}

const suspiciousPatterns = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /disregard\s+(previous|prior|all)\s+instructions/i,
  /you\s+are\s+now/i, /new\s+instructions/i, /system\s*:\s*/i, /\[system\]/i, /forget\s+everything/i,
];
function validateBody(value: unknown): ChatSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1000
    || suspiciousPatterns.some(pattern => pattern.test(body.message as string))) return null;
  const sessionId = body.sessionId ?? 'unknown';
  if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(sessionId)) return null;
  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > 10 || history.some(item => !item || typeof item !== 'object'
    || (item.role !== 'user' && item.role !== 'assistant') || typeof item.content !== 'string' || item.content.length > 8000)) return null;
  const token = body.turnstileToken;
  if (token != null && (typeof token !== 'string' || token.length > 2048)) return null;
  return { message: body.message, sessionId, history, ...(typeof token === 'string' && token && { turnstileToken: token }) };
}

export function createChatRoute(services: ChatServices, retainCompletion?: (completion: Promise<void>) => void) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') ?? undefined;
    const headers: Record<string, string> = { Vary: 'Origin', 'Cache-Control': 'no-store' };
    const fail = (status: number, code: string, error: string) => errorResponse(status, code, error, headers);
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
    const deadline = AbortSignal.timeout(20_000);
    let body: ChatSubmission | null;
    try { body = validateBody(await readJson(request)); }
    catch (error) { return fail(error instanceof JsonBodyError ? error.status : 400, 'VALIDATION', 'Invalid request body'); }
    if (!body) return fail(400, 'VALIDATION', 'Invalid message, session or history');
    const ip = getClientIp(requestHeaders(request));
    try {
      if (body.turnstileToken && !await services.verify(body.turnstileToken, ip, new URL(origin!).hostname)) {
        return fail(403, 'VERIFICATION_FAILED', 'Verification failed. Please try again.');
      }
    } catch { return fail(403, 'VERIFICATION_FAILED', 'Verification failed. Please try again.'); }
    try {
      const limit = await services.limit(ip, body.sessionId);
      if (limit === 'unavailable') return fail(503, 'SERVER_ERROR', 'Service temporarily unavailable');
      if (limit === 'limited') return fail(429, 'RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
    } catch { return fail(503, 'SERVER_ERROR', 'Service temporarily unavailable'); }

    const cancellation = new AbortController();
    const signal = AbortSignal.any([request.signal, cancellation.signal, deadline]);
    let source: AsyncIterable<string>;
    try { source = await services.stream(body, signal); }
    catch { return fail(500, 'SERVER_ERROR', 'Something went wrong. Please try again.'); }
    const submission = body;
    const encoder = new TextEncoder();
    let closed = false;
    let finish!: () => void;
    const completion = new Promise<void>(resolve => { finish = resolve; });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let chunks = 0;
        const send = (event: string) => { if (!closed) controller.enqueue(encoder.encode(`data: ${event}\n\n`)); };
        let interrupted = false;
        try {
          for await (const content of source) {
            if (signal.aborted) break;
            if (content) { chunks += 1; send(JSON.stringify({ content })); }
          }
        } catch { interrupted = true; }
        finally {
          // Persist already emitted chunks even when the client cancels or upstream fails.
          try { await services.account(ip, submission.sessionId, chunks); }
          catch { interrupted = true; console.error('Chat token accounting failed'); }
          if (!closed) {
            if (interrupted || signal.aborted) send(JSON.stringify({ error: 'Stream interrupted' }));
            else send('[DONE]');
            closed = true;
            controller.close();
          }
          cancellation.abort();
          finish();
        }
      },
      async cancel() { closed = true; cancellation.abort(); await completion; },
    });
    retainCompletion?.(completion);
    return new Response(stream, { headers: { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' } });
  };
}
