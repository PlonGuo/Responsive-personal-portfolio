// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { captureScroll, restoreScroll } from '../../lib/client/language-scroll';

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });
test('home restores the same relative point of a translated section below the fixed header', () => {
  document.body.innerHTML = '<header></header><section id="qualifications"></section>';
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1500);
  vi.spyOn(document.querySelector('header')!, 'getBoundingClientRect').mockReturnValue({ bottom: 64 } as DOMRect);
  const section = document.querySelector('section')!;
  const bounds = vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: -500, height: 2000 } as DOMRect);
  const snapshot = captureScroll('/en', '/zh', 'language-desktop-zh');
  expect(snapshot.sectionId).toBe('qualifications');
  expect(snapshot.sectionRatio).toBeCloseTo(0.29);
  bounds.mockReturnValue({ top: -500, height: 3000 } as DOMRect);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(10000);
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  restoreScroll(snapshot);
  expect(scroll).toHaveBeenCalledWith({ top: 1790, behavior: 'instant' });
});
test('other pages clamp a saved position into the new document', () => {
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(3000);
  const snapshot = captureScroll('/en/lab', '/zh/lab', 'language-desktop-zh');
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  restoreScroll(snapshot);
  expect(scroll).toHaveBeenCalledWith({ top: 1100, behavior: 'instant' });
});
test('an expanded mobile menu does not move the chapter capture point', () => {
  document.body.innerHTML = '<header><nav><div></div></nav></header><section id="about"></section>';
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1500);
  vi.spyOn(document.querySelector('header')!, 'getBoundingClientRect').mockReturnValue({ bottom: 380 } as DOMRect);
  vi.spyOn(document.querySelector('nav > div')!, 'getBoundingClientRect').mockReturnValue({ bottom: 64 } as DOMRect);
  vi.spyOn(document.querySelector('section')!, 'getBoundingClientRect').mockReturnValue({ top: -500, height: 2000 } as DOMRect);
  expect(captureScroll('/en', '/zh', 'mobile-menu-toggle').sectionRatio).toBeCloseTo(0.29);
});
