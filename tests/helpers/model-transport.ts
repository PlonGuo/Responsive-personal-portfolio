import { vi } from 'vitest';
export interface ProviderRequest {
  provider: 'deepseek' | 'openai'; url: string; authorization: string | null;
  body: Record<string, unknown>; signal: AbortSignal;
}
export const encoder = new TextEncoder();
export const data = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
export const chunk = (text: string) => data({ id: 'test-completion', model: 'test-model', created: 1700000000,
  choices: [{ index: 0, delta: { content: text }, finish_reason: null }] });
export const finish = (usage: unknown = { prompt_tokens: 23, completion_tokens: 7, total_tokens: 30 }) =>
  data({ id: 'test-completion', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], ...(usage !== null && { usage }) }) + 'data: [DONE]\n\n';
export const reply = (text = 'reply', usage?: unknown) => new Response(chunk(text) + finish(usage), {
  headers: { 'Content-Type': 'text/event-stream' },
});
export const failure = (status = 503) => new Response(JSON.stringify({ error: { message: 'private provider detail', type: 'test_error' } }), {
  status, headers: { 'Content-Type': 'application/json' },
});
export function transport(respond: (request: ProviderRequest, index: number) => Response | Promise<Response>) {
  const requests: ProviderRequest[] = [];
  const fetcher = vi.fn<typeof fetch>(async (url, options) => {
    const request: ProviderRequest = { provider: String(url).includes('deepseek.com') ? 'deepseek' : 'openai', url: String(url),
      authorization: new Headers(options?.headers).get('authorization'), body: JSON.parse(String(options?.body)), signal: options!.signal! };
    requests.push(request);
    return respond(request, requests.length - 1);
  });
  return { fetcher, requests };
}
export function stalled(request: ProviderRequest): Promise<Response> {
  return new Promise((_resolve, reject) => {
    if (request.signal.aborted) reject(request.signal.reason);
    else request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
}
export async function collect(source: AsyncIterable<string>) {
  let text = ''; for await (const part of source) text += part; return text;
}
