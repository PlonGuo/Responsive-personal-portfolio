import { getBrowserSession, type Theme } from './session';

// Static trusted code: run in the head before the first paint, never interpolate user data.
export const THEME_BOOTSTRAP = `(function(){var t='light';try{if(window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark'}catch(e){}try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')t=s}catch(e){}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t})();`;

export function applyTheme(theme: Theme, persist = true) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark'); root.classList.add(theme);
  document.body.classList.remove('light', 'dark'); document.body.classList.add(theme);
  root.style.colorScheme = theme;
  if (persist) { try { localStorage.setItem('theme', theme); } catch { /* The in-memory control stays usable. */ } }
}
export function setTheme(theme: Theme) {
  applyTheme(theme);
  getBrowserSession().setState(previous => previous.theme === theme ? previous : { ...previous, theme });
}
export function toggleTheme(event?: { clientX: number; clientY: number }) {
  const next = getBrowserSession().getSnapshot().theme === 'dark' ? 'light' : 'dark';
  const root = document.documentElement;
  root.style.setProperty('--ripple-x', `${event?.clientX ?? window.innerWidth / 2}px`);
  root.style.setProperty('--ripple-y', `${event?.clientY ?? window.innerHeight / 2}px`);
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => setTheme(next));
  } else setTheme(next);
}
