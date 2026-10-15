// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { useChatbot } from '../../src/hooks/useChatbot';
import { useContactDraft } from '../../src/hooks/useContactDraft';
import { createSessionState, getBrowserSession } from '../../lib/client/session';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function ChatView() {
  const chat = useChatbot();
  return <div><input aria-label="chat draft" value={chat.input} onChange={event => chat.setInput(event.target.value)} />
    <button onClick={chat.sendMessage}>send</button><span>{chat.messages.at(-1)?.content}</span><span data-testid="session-id">{chat.sessionId}</span></div>;
}
function ContactView() {
  const contact = useContactDraft();
  return <input aria-label="contact draft" value={contact.formData.message} onChange={event => contact.setField('message', event.target.value)} />;
}
test('actual hook unmount/remount keeps the request, transcript and stable ID', async () => {
  getBrowserSession().setState(createSessionState('hook-session'));
  let writer!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; } });
  const fetcher = vi.fn<typeof fetch>(async () => new Response(body));
  vi.stubGlobal('fetch', fetcher);
  const first = render(<ChatView />);
  fireEvent.change(screen.getByLabelText('chat draft'), { target: { value: 'question' } });
  fireEvent.click(screen.getByText('send'));
  await act(async () => { writer.enqueue(new TextEncoder().encode('data: {"content":"first"}\n\n')); });
  expect(screen.getByText('first')).toBeTruthy();
  first.unmount();
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
  await act(async () => {
    writer.enqueue(new TextEncoder().encode('data: {"content":" second"}\n\ndata: [DONE]\n\n')); writer.close();
  });
  render(<ChatView />);
  expect(screen.getByText('first second')).toBeTruthy();
  expect(screen.getByTestId('session-id').textContent).toBe('hook-session');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test('contact fields survive hook remount and browser data never enters a server render', () => {
  getBrowserSession().setState(createSessionState('contact-session'));
  const first = render(<ContactView />);
  fireEvent.change(screen.getByLabelText('contact draft'), { target: { value: 'private browser draft' } });
  first.unmount();
  const html = renderToString(<ContactView />);
  expect(html).not.toContain('private browser draft');
  render(<ContactView />);
  expect((screen.getByLabelText('contact draft') as HTMLInputElement).value).toBe('private browser draft');
});

test('an expired or errored solved captcha restores the verification gate', () => {
  getBrowserSession().setState({ ...createSessionState('verification-session'), chat: {
    ...createSessionState('verification-session').chat, messageCount: 10, needsVerification: true,
  } });
  function VerificationView() {
    const chat = useChatbot();
    return <><button onClick={() => chat.setTurnstileToken('solved-token')}>solve</button>
      <button onClick={() => chat.setTurnstileToken(null)}>expire</button></>;
  }
  render(<VerificationView />);
  fireEvent.click(screen.getByText('solve'));
  expect(getBrowserSession().getSnapshot().chat.needsVerification).toBe(false);
  fireEvent.click(screen.getByText('expire'));
  expect(getBrowserSession().getSnapshot().chat.turnstileToken).toBeNull();
  expect(getBrowserSession().getSnapshot().chat.needsVerification).toBe(true);
});
