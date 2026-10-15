// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import ChatMarkdown from '../../src/components/ChatMarkdown';

afterEach(cleanup);

test('renders the reported bold numbered response as Markdown', () => {
  const { container } = render(<ChatMarkdown content={'8. **技术栈与方向**：语言 Python、TypeScript/JavaScript、Go、SQL。'} />);
  expect(container.querySelector('ol')?.getAttribute('start')).toBe('8');
  expect(container.querySelector('li strong')?.textContent).toBe('技术栈与方向');
  expect(container.textContent).not.toContain('**');
});

test('renders code, links and tables within the message', () => {
  const { container } = render(<ChatMarkdown content={'Use `TypeScript`.\n\n```ts\nconst value = 1;\n```\n\n[Source](https://example.com)\n\n| Name | Value |\n| --- | --- |\n| Test | 1 |'} />);
  expect(container.querySelector('pre code')?.textContent).toBe('const value = 1;\n');
  expect(container.querySelector('table td')?.textContent).toBe('Test');
  expect(screen.getByRole('link', { name: 'Source' }).getAttribute('rel')).toContain('noopener');
});

test('does not render executable HTML, dangerous links or remote images', () => {
  const { container } = render(<ChatMarkdown content={'<script>alert(1)</script>\n\n<img src="https://example.com/track" onerror="alert(1)">\n\n[bad](javascript:alert%281%29)\n\n![track](https://example.com/pixel)'} />);
  expect(container.querySelector('script,img,iframe')).toBeNull();
  expect(container.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(/^javascript:/i);
});

test('finishes streamed formatting without altering the source text', () => {
  const { container, rerender } = render(<ChatMarkdown content={'**技术'} />);
  expect(container.textContent).toContain('技术');
  rerender(<ChatMarkdown content={'**技术栈**：Python'} />);
  expect(container.querySelector('strong')?.textContent).toBe('技术栈');
  expect(container.textContent).toBe('技术栈：Python');
});
