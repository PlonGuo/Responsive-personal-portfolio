import { afterEach, expect, test, vi } from 'vitest';
import { createContactRuntime } from '../../lib/client/contact-runtime';
import { createStore } from '../../lib/client/store';
import { createSessionState } from '../../lib/client/session';
afterEach(() => { vi.useRealTimers(); });

test('contact completion and status reset survive detaching every subscriber', async () => {
  vi.useFakeTimers();
  let finish!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(() => new Promise(resolve => { finish = resolve; }));
  const store = createStore(createSessionState('id'));
  store.setState(previous => ({ ...previous, contact: { ...previous.contact, formData: { name: 'Jason', email: 'me@example.com', subject: 'hi', message: 'draft' } } }));
  const runtime = createContactRuntime(store, fetcher);
  const detach = store.subscribe(() => {});
  const pending = runtime.submit('fresh-token');
  detach();
  await runtime.submit('same-token');
  expect(fetcher).toHaveBeenCalledTimes(1);
  finish(Response.json({ success: true })); await pending;
  expect(store.getSnapshot().contact.status).toBe('success');
  expect(store.getSnapshot().contact.formData.name).toBe('');
  expect(store.getSnapshot().contact.verificationVersion).toBe(1);
  await vi.advanceTimersByTimeAsync(3000);
  expect(store.getSnapshot().contact.status).toBe('idle');
});
test('a new draft edited during a pending request is not cleared by its completion', async () => {
  let finish!: (response: Response) => void;
  const store = createStore(createSessionState('id'));
  const runtime = createContactRuntime(store, () => new Promise(resolve => { finish = resolve; }));
  const pending = runtime.submit('token');
  store.setState(previous => ({ ...previous, contact: { ...previous.contact, formData: { ...previous.contact.formData, message: 'new draft' } } }));
  finish(Response.json({ success: true })); await pending;
  expect(store.getSnapshot().contact.formData.message).toBe('new draft');
});
test('no token causes no request; API errors store only a translatable code', async () => {
  const store = createStore(createSessionState('id'));
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ error: 'private stack', code: 'RATE_LIMIT' }, { status: 429 }));
  const runtime = createContactRuntime(store, fetcher);
  await runtime.submit('');
  expect(fetcher).not.toHaveBeenCalled();
  await runtime.submit('token');
  expect(store.getSnapshot().contact.errorCode).toBe('rateLimit');
  expect(store.getSnapshot().contact.status).toBe('error');
});
