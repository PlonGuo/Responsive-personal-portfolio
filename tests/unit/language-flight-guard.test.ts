// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { guardLanguageFlight } from '../../lib/client/language-flight-guard';
afterEach(() => { vi.unstubAllGlobals(); });
beforeEach(() => { vi.stubGlobal('navigation', new EventTarget()); });

test('ordinary API calls are untouched and a successful route retains its Response identity', async () => {
  const response = new Response('0:[]\n', { headers: { 'content-type': 'text/x-component' } });
  const fetcher = vi.fn<typeof fetch>(async () => response); vi.stubGlobal('fetch', fetcher);
  const failed = vi.fn(); const release = guardLanguageFlight('/zh', failed);
  expect(await fetch('/api/chat', { method: 'POST' })).toBe(response);
  expect(await fetch('/zh?_rsc=test', { headers: { RSC: '1' } })).toBe(response);
  expect(failed).not.toHaveBeenCalled();
  release(); expect(window.fetch).toBe(fetcher);
});
test.each(['network', 'HTTP', 'wrong-content-type'])('a %s failure is recovered before Next can hard-navigate', async kind => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    if (kind === 'network') throw new TypeError('network');
    return new Response('not a route', { status: kind === 'HTTP' ? 503 : 200 });
  }));
  const failed = vi.fn(); const release = guardLanguageFlight('/zh', failed);
  let settled = false;
  void fetch('/zh?_rsc=test', { headers: { RSC: '1' } }).finally(() => { settled = true; });
  await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
  expect(settled).toBe(false);
  release();
});
test('only a programmatic target document fallback is canceled; release removes the guard', async () => {
  const navigation = (window as unknown as { navigation: EventTarget }).navigation;
  vi.stubGlobal('fetch', vi.fn());
  const failed = vi.fn(); const release = guardLanguageFlight('/zh', failed);
  const navigate = (overrides = {}) => {
    const event = Object.assign(new Event('navigate', { cancelable: true }), {
      destination: { url: new URL('/zh', location.origin).href, sameDocument: false }, userInitiated: false, navigationType: 'push', ...overrides,
    });
    navigation.dispatchEvent(event); return event;
  };
  expect(navigate({ userInitiated: true }).defaultPrevented).toBe(false);
  expect(navigate({ navigationType: 'reload' }).defaultPrevented).toBe(false);
  expect(navigate({ destination: { url: new URL('/en/lab', location.origin).href, sameDocument: false } }).defaultPrevented).toBe(false);
  expect(navigate({ destination: { url: new URL('/zh', location.origin).href, sameDocument: true } }).defaultPrevented).toBe(false);
  expect(navigate().defaultPrevented).toBe(true);
  await Promise.resolve(); expect(failed).toHaveBeenCalledTimes(1);
  release(); expect(navigate().defaultPrevented).toBe(false);
});
