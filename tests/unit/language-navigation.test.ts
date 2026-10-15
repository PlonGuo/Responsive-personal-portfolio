// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); history.replaceState({}, '', '/en'); vi.stubGlobal('navigation', new EventTarget()); });
afterEach(() => { vi.unstubAllGlobals(); });
const router = () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() });

test('an unreachable destination keeps the current URL and releases the lock for retry', async () => {
  const nav = await import('../../lib/client/language-navigation');
  const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
  vi.stubGlobal('fetch', fetcher);
  const r = router();
  await nav.beginLanguageNavigation('/zh', r);
  expect(location.pathname).toBe('/en'); expect(r.push).not.toHaveBeenCalled();
  expect(nav.getLanguageNavigation().getSnapshot()).toMatchObject({ pending: false, errorCode: 'navigation' });
  fetcher.mockResolvedValue(new Response(null, { status: 200 }));
  await nav.beginLanguageNavigation('/zh', r);
  expect(r.push).toHaveBeenCalledWith('/zh', { scroll: false });
  expect(fetcher.mock.calls[0]?.[0]).toBe('/zh');
});
test('double selection causes only one HEAD and one push; prefetch is optional', async () => {
  history.replaceState({}, '', '/en#contact');
  const nav = await import('../../lib/client/language-navigation');
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(() => new Promise(done => { resolve = done; }));
  vi.stubGlobal('fetch', fetcher);
  const r = router();
  const pending = nav.beginLanguageNavigation('/zh#contact', r);
  await nav.beginLanguageNavigation('/zh#contact', r);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[1]?.method).toBe('HEAD');
  resolve(new Response(null, { status: 200 })); await pending;
  expect(r.push).toHaveBeenCalledTimes(1);
  expect(nav.getLanguageNavigation().getSnapshot().pending).toBe(true);
});
test('only a corresponding same-origin language target may be navigated', async () => {
  const nav = await import('../../lib/client/language-navigation');
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  const r = router();
  await nav.beginLanguageNavigation('https://evil.example/zh', r);
  await nav.beginLanguageNavigation('javascript:alert(1)', r);
  expect(fetcher).not.toHaveBeenCalled(); expect(r.push).not.toHaveBeenCalled();
});
test('a newer query selection invalidates a delayed language preflight', async () => {
  history.replaceState({}, '', '/en/blog?tag=AI');
  const nav = await import('../../lib/client/language-navigation');
  let resolve!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(() => new Promise(done => { resolve = done; })));
  const r = router();
  const pending = nav.beginLanguageNavigation('/zh/blog?tag=AI', r);
  history.replaceState({}, '', '/en/blog?tag=React');
  resolve(new Response(null, { status: 200 })); await pending;
  expect(r.push).not.toHaveBeenCalled();
  expect(location.search).toBe('?tag=React');
  expect(nav.getLanguageNavigation().getSnapshot()).toMatchObject({ pending: false, errorCode: null });
});
test('an engine without a cancellable document fallback keeps the source and draft', async () => {
  vi.stubGlobal('navigation', undefined);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })));
  const nav = await import('../../lib/client/language-navigation'); const r = router();
  await nav.beginLanguageNavigation('/zh', r);
  expect(r.push).not.toHaveBeenCalled(); expect(location.pathname).toBe('/en');
  expect(nav.getLanguageNavigation().getSnapshot()).toMatchObject({ pending: false, errorCode: 'navigation' });
});

test('a warmed target navigates without another network check at click time', async () => {
  const nav = await import('../../lib/client/language-navigation');
  const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  const r = router();
  await nav.warmLanguageNavigation('/zh', r);
  fetcher.mockImplementation(() => new Promise(() => {}));
  const navigation = nav.beginLanguageNavigation('/zh', r);
  await Promise.resolve();
  expect(r.push).toHaveBeenCalledWith('/zh', { scroll: false });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(r.prefetch).toHaveBeenCalledWith('/zh');
  await navigation;
});

test('clicking during target warmup shares its pending check', async () => {
  const nav = await import('../../lib/client/language-navigation');
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(() => new Promise(done => { resolve = done; }));
  vi.stubGlobal('fetch', fetcher);
  const r = router();
  const warming = nav.warmLanguageNavigation('/zh', r);
  const navigation = nav.beginLanguageNavigation('/zh', r);
  expect(fetcher).toHaveBeenCalledTimes(1);
  resolve(new Response(null, { status: 200 }));
  await warming; await navigation;
  expect(r.push).toHaveBeenCalledTimes(1);
});

test('a failed background check remains retryable at click time', async () => {
  const nav = await import('../../lib/client/language-navigation');
  const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  const r = router();
  await nav.warmLanguageNavigation('/zh', r);
  await nav.beginLanguageNavigation('/zh', r);
  expect(r.push).toHaveBeenCalledWith('/zh', { scroll: false });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('an expired warm check is refreshed rather than trusted indefinitely', async () => {
  vi.useFakeTimers();
  try {
    const nav = await import('../../lib/client/language-navigation');
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    const r = router();
    await nav.warmLanguageNavigation('/zh', r);
    await vi.advanceTimersByTimeAsync(300_001);
    await nav.beginLanguageNavigation('/zh', r);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(r.push).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); }
});
