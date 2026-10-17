import type { UIMessageChunk } from 'ai';

export const uiStart: UIMessageChunk[] = [{ type: 'start', messageId: 'assistant-1' }, { type: 'text-start', id: 'text-1' }];
export const uiDelta = (text: string): UIMessageChunk => ({ type: 'text-delta', id: 'text-1', delta: text });
export const uiFinish: UIMessageChunk[] = [{ type: 'text-end', id: 'text-1' }, { type: 'finish', finishReason: 'stop' }];
export const uiEvents = (chunks: UIMessageChunk[]) => chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
export const uiReply = (text: string) => uiEvents([...uiStart, uiDelta(text), ...uiFinish]) + 'data: [DONE]\n\n';
export function delayedUIResponse() {
  let writer!: ReadableStreamDefaultController<Uint8Array>;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; }, cancel() { cancelled = true; } });
  return { response: new Response(body, { headers: { 'Content-Type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' } }),
    send: (chunks: UIMessageChunk[]) => writer.enqueue(new TextEncoder().encode(uiEvents(chunks))),
    close: () => writer.close(), get cancelled() { return cancelled; } };
}
