// @vitest-environment jsdom
import { useLayoutEffect } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { setTheme } from '../../lib/client/theme';
import ThemeBootstrap from '../../src/components/ThemeBootstrap';
import type { Locale } from '../../lib/i18n/locales';
vi.mock('next/navigation', () => ({ useServerInsertedHTML: () => {} }));
afterEach(() => { cleanup(); setTheme('light'); });

test('locale commits restore the live dark theme before layout effects can paint', () => {
  const observed: boolean[] = [];
  function Probe({ locale }: { locale: Locale }) {
    useLayoutEffect(() => { observed.push(document.documentElement.classList.contains('dark')); }, [locale]);
    return <ThemeBootstrap locale={locale} />;
  }
  setTheme('dark');
  const view = render(<Probe locale="en" />);
  // React applies the server root's light attribute during the next locale commit.
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  localStorage.setItem('theme', 'light');
  view.rerender(<Probe locale="zh" />);
  expect(observed).toEqual([true, true]);
  expect(document.documentElement.style.colorScheme).toBe('dark');
});
