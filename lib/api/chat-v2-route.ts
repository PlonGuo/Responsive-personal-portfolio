import { createUIMessageStream, createUIMessageStreamResponse, type UIMessageChunk } from 'ai';
import { parseUIChat } from './chat-input';
import { createChatHandler, type ChatServices } from './chat-lifecycle';

export function createChatV2Route(services: ChatServices, retainCompletion?: (completion: Promise<void>) => void) {
  return createChatHandler<UIMessageChunk>(services, {
    parse: parseUIChat,
    events() {
      const id = crypto.randomUUID();
      return {
        start: [{ type: 'start', messageId: id }, { type: 'text-start', id }],
        delta: text => ({ type: 'text-delta', id, delta: text }),
        success: [{ type: 'text-end', id }, { type: 'finish', finishReason: 'stop' }],
        failure: { type: 'error', errorText: 'generic' },
      };
    },
    respond(source, headers) {
      // merge owns a reader whose cancellation propagates to the shared lifecycle.
      // Running a separate async writer loop here would leave the model alive.
      const stream = createUIMessageStream({ execute: ({ writer }) => writer.merge(source), onError: () => 'generic' });
      return createUIMessageStreamResponse({ stream, headers });
    },
  }, retainCompletion);
}
