import { homeSections } from '../i18n/routes';
import type { SectionId } from '../i18n/locales';

export interface ScrollSnapshot {
  source: string; target: string; y: number; sectionId?: SectionId; sectionRatio?: number;
  hash: string; focusId: string;
}
const headerOffset = () => (document.querySelector('header nav > div')?.getBoundingClientRect().bottom
  ?? document.querySelector('header')?.getBoundingClientRect().bottom ?? 64) + 16;

export function captureScroll(source: string, target: string, focusId: string): ScrollSnapshot {
  const url = new URL(source, window.location.origin);
  const snapshot: ScrollSnapshot = { source, target, y: window.scrollY, hash: url.hash, focusId };
  if (!/^\/(en|zh)\/?$/.test(url.pathname)) return snapshot;
  const anchor = window.scrollY + headerOffset();
  for (const id of homeSections) {
    const box = document.getElementById(id)?.getBoundingClientRect();
    if (!box || box.height <= 0) continue;
    const top = box.top + window.scrollY;
    if (top <= anchor) {
      snapshot.sectionId = id;
      snapshot.sectionRatio = Math.max(0, Math.min(1, (anchor - top) / box.height));
    }
  }
  return snapshot;
}

export function restoreScroll(snapshot: ScrollSnapshot) {
  let top = snapshot.y;
  if (snapshot.sectionId) {
    const box = document.getElementById(snapshot.sectionId)?.getBoundingClientRect();
    if (box) top = box.top + window.scrollY + (snapshot.sectionRatio ?? 0) * box.height - headerOffset();
  }
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top: Math.max(0, Math.min(max, top)), behavior: 'instant' });
}
