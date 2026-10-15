import { expect, test } from 'vitest';
import { createStore } from '../../lib/client/store';
import { createSessionState, getBrowserSession, getServerSnapshot } from '../../lib/client/session';

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
  expect(getServerSnapshot().chat.messages).toEqual([]);
  expect(() => getBrowserSession()).toThrow();
  expect(createSessionState('first').chat.messages).not.toBe(createSessionState('second').chat.messages);
});
