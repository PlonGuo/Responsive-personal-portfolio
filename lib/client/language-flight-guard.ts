/**
 * Next 16.4 falls back to document navigation when a Flight fetch rejects.
 * Scope this guard to one explicit language transition. On transport failure,
 * the caller replaces it with a cached source navigation. Keep the superseded
 * fetch unsettled so it cannot trigger Next's hard-navigation fallback.
 */
export function guardLanguageFlight(target: string, failed: () => void) {
  const original = window.fetch;
  const destination = new URL(target, location.origin);
  let active = true;
  const cancellation = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  // Navigation API is a last line of defense for a successful HTTP response
  // whose Flight data Next cannot decode. Do not intercept user navigation.
  const navigation = (window as Window & { navigation?: {
    addEventListener(type: 'navigate', listener: (event: Event) => void): void;
    removeEventListener(type: 'navigate', listener: (event: Event) => void): void;
  } }).navigation;
  // Older engines cannot cancel Next's document fallback. Keep the source
  // instead of risking loss of an in-flight reply or an unsaved form.
  if (!navigation) throw new Error('Safe client navigation is unavailable');
  const onNavigate = (event: Event) => {
    const nav = event as Event & { destination: { url: string; sameDocument: boolean }; userInitiated: boolean; navigationType: string };
    const url = new URL(nav.destination.url);
    if (!active || !nav.cancelable || nav.destination.sameDocument || nav.userInitiated
      || !['push', 'replace'].includes(nav.navigationType)
      || url.origin !== destination.origin || url.pathname !== destination.pathname) return;
    nav.preventDefault(); release(true);
    queueMicrotask(failed);
  };
  const release = (cancel = false) => {
    active = false; clearTimeout(timeout);
    if (window.fetch === guarded) window.fetch = original;
    navigation?.removeEventListener('navigate', onNavigate);
    if (cancel) cancellation.abort();
  };
  const guarded: typeof fetch = async (input, init) => {
    const request = input instanceof Request ? input : undefined;
    const url = new URL(request?.url ?? String(input), location.origin);
    const headers = new Headers(init?.headers ?? request?.headers);
    if (url.origin !== destination.origin || url.pathname !== destination.pathname || headers.get('RSC') !== '1'
      || headers.has('Next-Router-Prefetch') || headers.has('Next-Router-Segment-Prefetch')) {
      return original.call(window, input, init);
    }
    timeout ??= setTimeout(() => { if (active) { release(true); failed(); } }, 10_000);
    try {
      const upstream = init?.signal ?? request?.signal;
      const signal = upstream ? AbortSignal.any([upstream, cancellation.signal]) : cancellation.signal;
      const response = await original.call(window, input, { ...init, signal });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('text/x-component') || !response.body
        || (response.redirected && new URL(response.url).origin !== destination.origin)) throw new Error('Invalid route response');
      // Read a clone before handing the response to Next: this also catches a
      // stream that disconnects after headers. Preserve Response.url/identity.
      await response.clone().arrayBuffer();
      return response;
    } catch {
      if (active) { release(true); failed(); }
      return new Promise<Response>(() => {});
    }
  };
  navigation?.addEventListener('navigate', onNavigate);
  window.fetch = guarded;
  return release;
}
