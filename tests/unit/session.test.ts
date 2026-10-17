import { expect, test } from 'vitest';
import { createStore } from '../../lib/client/store';
import { createSessionState, getBrowserSession, getServerSnapshot } from '../../lib/client/session';
import { getChatInstance } from '../../lib/client/chat-instance';

test('detaching a subscriber preserves drafts, history, ID and later updates', () => {
  const store = createStore(createSessionState('same-id'));
  const detach = store.subscribe(() => {});
  store.setState(previous => ({ ...previous, chat: { ...previous.chat, input: 'draft' } }));
  detach();
  store.setState(previous => ({ ...previous, contact: { ...previous.contact, formData: { ...previous.contact.formData, name: 'Jason' } } }));
  expect(store.getSnapshot().chat.input).toBe('draft');
  expect(store.getSnapshot().chat.sessionId).toBe('same-id');
  expect(store.getSnapshot().contact.formData.name).toBe('Jason');
  expect(store.getSnapshot()).toBe(store.getSnapshot());
});
test('server snapshots are stable, empty and never create a visitor singleton', () => {
  expect(getServerSnapshot()).toBe(getServerSnapshot());
  expect(getServerSnapshot().chat.sessionId).toBe('');
  expect(getServerSnapshot().chat).not.toHaveProperty('messages');
  expect(getServerSnapshot().chat).not.toHaveProperty('isLoading');
  expect(getServerSnapshot().chat).not.toHaveProperty('error');
  expect(() => getBrowserSession()).toThrow();
  expect(() => getChatInstance()).toThrow('browser-only');
  expect(createSessionState('first').chat).not.toBe(createSessionState('second').chat);
});
