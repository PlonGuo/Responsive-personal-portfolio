import { getChatInstance, type createChatInstance } from './chat-instance';

// Compatibility facade for event handlers. SDK Chat owns the network and state.
export function createChatRuntime(instance: ReturnType<typeof createChatInstance>) {
  return { sendMessage: instance.sendMessage, abortRequest: instance.abortRequest };
}
export function getChatRuntime() {
  return createChatRuntime(getChatInstance());
}
