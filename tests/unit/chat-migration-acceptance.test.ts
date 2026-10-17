import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createChatRoute } from '../../lib/api/chat-route';
import { createChatV2Route } from '../../lib/api/chat-v2-route';
import { chatServices } from '../../lib/api/chat-services';
import { createContactRoute } from '../../lib/api/contact-route';
import { reply, transport } from '../helpers/model-transport';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
test.each(['legacy', 'v2'] as const)('%s keeps chat text raw while the same HTML stays escaped in contact email', async protocol => {
  vi.stubEnv('DEEPSEEK_API_KEY', 'fixture-key');
  const text = "What's React/Vue？<中文><script>alert('x')</script>";
  const { fetcher, requests } = transport(() => reply('reply'));
  vi.stubGlobal('fetch', fetcher);
  const handle = (protocol === 'legacy' ? createChatRoute : createChatV2Route)({ ...chatServices,
    admit: async (ipKey, requestId) => ({ status: 'allowed', permit: { ipKey, requestId, windowId: 'fixture' } }), settle: async () => {},
  });
  const response = await handle(new Request(`https://www.plonguo.com/api/chat${protocol === 'v2' ? '/v2' : ''}`, {
    method: 'POST', headers: { Origin: 'https://www.plonguo.com', 'Content-Type': 'application/json' },
    body: JSON.stringify(protocol === 'legacy' ? { message: text, sessionId: 'fixture', history: [] }
      : { sessionId: 'fixture', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text }] }] }),
  }));
  expect(response.status).toBe(200); await response.text();
  const messages = requests[0].body.messages as Array<{ role: string; content: string }>;
  expect(messages.at(-1)?.content).toBe(text);
  let emailHtml = '';
  const contact = createContactRoute({ verify: async () => true, limit: async () => 'allowed', send: async email => { emailHtml = email.html; } });
  expect((await contact(new Request('https://www.plonguo.com/api/send-email', { method: 'POST',
    headers: { Origin: 'https://www.plonguo.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Fixture', email: 'fixture@example.com', subject: 'HTML fixture', message: text, turnstileToken: 'fixture' }),
  }))).status).toBe(200);
  expect(emailHtml).toContain('&lt;script&gt;'); expect(emailHtml).not.toContain('<script>');
});
