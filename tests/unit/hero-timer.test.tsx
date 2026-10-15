// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useTypewriter } from '../../src/hooks/useTypewriter';

function Preview({ lines, reduced = false }: { lines: string[]; reduced?: boolean }) {
  return <span data-testid="typewriter">{useTypewriter(lines, reduced)}</span>;
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

test('switching language immediately shows its first line and cancels the old timer', () => {
  vi.useFakeTimers();
  const english = ['Jason', 'Engineer'];
  const chinese = ['过汇智融', '工程师'];
  const view = render(<Preview lines={english} />);
  expect(screen.getByTestId('typewriter').textContent).toBe('Jason');
  act(() => { vi.advanceTimersByTime(2050); });
  view.rerender(<Preview lines={chinese} />);
  expect(screen.getByTestId('typewriter').textContent).toBe('过汇智融');
  act(() => { vi.advanceTimersByTime(100); });
  expect(screen.getByTestId('typewriter').textContent).toBe('过汇智融');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('reduced motion leaves a complete static phrase and no typing timers', () => {
  vi.useFakeTimers();
  render(<Preview lines={['过汇智融', '工程师']} reduced />);
  act(() => { vi.advanceTimersByTime(10000); });
  expect(screen.getByTestId('typewriter').textContent).toBe('过汇智融');
  expect(vi.getTimerCount()).toBe(0);
});
