import { createChatHandler, type ChatServices } from './chat-lifecycle';
import { parseLegacyChat } from './chat-input';

export type { ChatServices } from './chat-lifecycle';
export type { NormalizedChatInput as ChatSubmission } from './chat-input';

// Keep the original wire contract for pages already open before the SDK upgrade.
export function createChatRoute(services: ChatServices, retainCompletion?: (completion: Promise<void>) => void) {
  const encoder = new TextEncoder();
  const event = (value: string) => encoder.encode(`data: ${value}\n\n`);
  return createChatHandler(services, {
    parse: parseLegacyChat,
    events: () => ({ start: [], delta: (content: string) => event(JSON.stringify({ content })),
      success: [event('[DONE]')], failure: event(JSON.stringify({ error: 'Stream interrupted' })) }),
    respond(stream, headers) {
      return new Response(stream, { headers: { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' } });
    },
  }, retainCompletion);
}
