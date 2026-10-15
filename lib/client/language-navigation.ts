import { createStore } from './store';
import { captureScroll, restoreScroll, type ScrollSnapshot } from './language-scroll';
import { getLanguageTarget } from '../i18n/routes';
import { isLocale } from '../i18n/locales';
import { flushSync } from 'react-dom';
import { guardLanguageFlight } from './language-flight-guard';

export interface NavigationRouter {
  push(href: string, options: { scroll: boolean }): void;
  replace(href: string, options: { scroll: boolean }): void;
  prefetch(href: string): void;
}
interface NavigationState {
  source: string; target: string; pending: boolean; errorCode: 'navigation' | null;
  phase: 'idle' | 'checking' | 'navigating' | 'recovering';
}
const empty: NavigationState = { source: '', target: '', pending: false, errorCode: null, phase: 'idle' };
export const getNavigationServerSnapshot = () => empty;
let store: ReturnType<typeof createStore<NavigationState>> | undefined;
export function getLanguageNavigation() {
  if (typeof window === 'undefined') throw new Error('Language navigation is browser-only');
  return store ??= createStore(empty);
}
const relative = () => location.pathname + location.search + location.hash;
const entryKey = '__portfolioLanguageEntry';
const entries = new Map<string, ScrollSnapshot>();
let renderedURL = '';
let renderedEntry = '';
let snapshot: ScrollSnapshot | undefined;
let popSnapshot: ScrollSnapshot | undefined;
let initialized = false;
let generation = 0;
let checkAbort: AbortController | undefined;
let releaseFlightGuard: ((cancel?: boolean) => void) | undefined;
let activeRouter: NavigationRouter | undefined;

function cancelLanguageNavigation(replace = false) {
  const state = getLanguageNavigation();
  const previous = state.getSnapshot();
  if (!previous.pending) return;
  ++generation; checkAbort?.abort(); releaseFlightGuard?.(true); releaseFlightGuard = undefined;
  state.setState({ ...previous, pending: false, errorCode: null, phase: 'idle' });
  // A query update does not start another Next transition by itself. Supersede
  // any already-started language transition before it can commit the old query.
  if (replace && previous.phase !== 'checking') activeRouter?.replace(relative(), { scroll: false });
  activeRouter = undefined;
}

function entry(fresh = false) {
  let id = history.state?.[entryKey] as string | undefined;
  if (fresh || !id) {
    id = crypto.randomUUID();
    history.replaceState({ ...history.state, [entryKey]: id }, '', location.href);
  }
  return id;
}
function remember() {
  if (renderedEntry && renderedURL) entries.set(renderedEntry, captureScroll(renderedURL, renderedURL, entries.get(renderedEntry)?.focusId ?? ''));
}
function restoreAfterCommit(saved: ScrollSnapshot, focus = true) {
  const turn = ++generation;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (generation !== turn) return;
    releaseFlightGuard?.(); releaseFlightGuard = undefined;
    restoreScroll(saved);
    renderedURL = relative();
    renderedEntry = entry();
    entries.set(renderedEntry, captureScroll(renderedURL, renderedURL, saved.focusId));
    const state = getLanguageNavigation();
    flushSync(() => state.setState(previous => ({ ...previous, pending: false, phase: 'idle' })));
    if (focus && saved.focusId) document.getElementById(saved.focusId)?.focus({ preventScroll: true });
  }));
}

export function initializeLanguageNavigation() {
  if (initialized) return;
  initialized = true;
  history.scrollRestoration = 'manual';
  renderedURL = relative(); renderedEntry = entry(); remember();
  window.addEventListener('scroll', () => {
    if (!getLanguageNavigation().getSnapshot().pending && relative() === renderedURL) remember();
  }, { passive: true });
  window.addEventListener('portfolio-query', () => {
    cancelLanguageNavigation(true); observeLanguageNavigation(location.pathname);
  });
  window.addEventListener('hashchange', () => {
    if (getLanguageNavigation().getSnapshot().pending) cancelLanguageNavigation(true);
  });
  // Cancel on intent, before the new Link route commits. Otherwise an old
  // language failure could replace a newer, still-loading ordinary navigation.
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.download || (anchor.target && anchor.target !== '_self')) return;
    const url = new URL(anchor.href);
    if (url.origin === location.origin) cancelLanguageNavigation(url.pathname === location.pathname);
  }, true);
  window.addEventListener('popstate', () => {
    remember(); checkAbort?.abort(); ++generation;
    releaseFlightGuard?.(true); releaseFlightGuard = undefined;
    getLanguageNavigation().setState(previous => ({ ...previous, pending: false, errorCode: null, phase: 'idle' }));
    popSnapshot = entries.get(history.state?.[entryKey]);
    if (popSnapshot && new URL(renderedURL, location.origin).pathname === location.pathname) {
      restoreAfterCommit(popSnapshot); popSnapshot = undefined;
    }
  });
}

export async function beginLanguageNavigation(target: string, router: NavigationRouter, focusId?: string) {
  const state = getLanguageNavigation();
  if (state.getSnapshot().pending) return;
  const url = new URL(target, location.origin);
  const locale = url.pathname.split('/')[1];
  if (url.origin !== location.origin || !isLocale(locale)
    || getLanguageTarget(new URL(location.href), locale) !== target || target === relative()) return;
  const source = relative();
  activeRouter = router;
  const attempt = ++generation;
  const focus = focusId ?? (innerWidth < 768 ? 'mobile-menu-toggle' : 'language-desktop-toggle');
  snapshot = captureScroll(source, target, focus);
  const sourceFocus = focus.replace(/-(en|zh)$/, `-${location.pathname.split('/')[1]}`);
  renderedEntry = entry(); entries.set(renderedEntry, captureScroll(source, source, sourceFocus));
  state.setState({ source, target, pending: true, phase: 'checking', errorCode: null });
  const abort = new AbortController(); checkAbort = abort;
  const timeout = setTimeout(() => abort.abort(), 5000);
  try {
    const response = await fetch(url.pathname + url.search, { method: 'HEAD', cache: 'no-store', signal: abort.signal });
    if (attempt !== generation) return;
    if (relative() !== source) { cancelLanguageNavigation(); return; }
    if (!response.ok || response.redirected || abort.signal.aborted) throw new Error('Destination unavailable');
    state.setState(previous => ({ ...previous, phase: 'navigating' }));
    releaseFlightGuard = guardLanguageFlight(target, () => {
      if (attempt !== generation) return;
      recoverLanguageNavigation(router);
      observeLanguageNavigation(location.pathname);
    });
    router.push(target, { scroll: false });
  } catch {
    if (attempt !== generation) return;
    releaseFlightGuard?.(true); releaseFlightGuard = undefined;
    console.error('Language navigation could not be completed');
    flushSync(() => state.setState(previous => ({ ...previous, pending: false, phase: 'idle', errorCode: 'navigation' })));
    document.getElementById(focus)?.focus({ preventScroll: true });
  } finally { clearTimeout(timeout); if (checkAbort === abort) checkAbort = undefined; }
}

export function observeLanguageNavigation(pathname: string) {
  const state = getLanguageNavigation().getSnapshot();
  if (state.pending && snapshot) {
    if (pathname !== new URL(state.source, location.origin).pathname && pathname !== new URL(state.target, location.origin).pathname) {
      ++generation; checkAbort?.abort(); releaseFlightGuard?.(true); releaseFlightGuard = undefined;
      getLanguageNavigation().setState(previous => ({ ...previous, pending: false, errorCode: null, phase: 'idle' }));
      renderedURL = relative(); renderedEntry = entry(true); remember();
      return;
    }
    const expected = state.phase === 'recovering' ? state.source : state.target;
    if (pathname === new URL(expected, location.origin).pathname) {
      if (state.phase !== 'recovering') entry(true);
      restoreAfterCommit(snapshot);
    }
    return;
  }
  if (popSnapshot && pathname === location.pathname) {
    const saved = popSnapshot; popSnapshot = undefined;
    restoreAfterCommit(saved);
  } else if (relative() !== renderedURL) {
    renderedEntry = entry(history.state?.[entryKey] === renderedEntry);
    renderedURL = relative(); remember();
  }
}

export function dismissLanguageError() {
  getLanguageNavigation().setState(previous => ({ ...previous, errorCode: null }));
}
export function recoverLanguageNavigation(router: NavigationRouter) {
  const state = getLanguageNavigation();
  const current = state.getSnapshot();
  if (!current.pending || !current.source) return false;
  state.setState(previous => ({ ...previous, phase: 'recovering', errorCode: 'navigation' }));
  router.replace(current.source, { scroll: false });
  return true;
}
